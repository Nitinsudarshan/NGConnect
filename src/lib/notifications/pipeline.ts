import { createAdminClient } from '@/lib/supabase/admin';
import { checkSendEligibility } from './gate';
import { renderEmailTemplate, MissingTemplateVariableError } from './render';
import { sendEmailViaDispatcher } from '@/lib/email/dispatcher';
import crypto from 'crypto';

export interface EnqueueOptions {
  triggerCode: string;
  alumniEmail: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  context?: Record<string, any>;
}

export async function enqueueNotification(opts: EnqueueOptions) {
  const supabase = createAdminClient();

  // Find active trigger by code
  const { data: trigger } = await supabase
    .from('notification_triggers')
    .select('id, is_active')
    .eq('code', opts.triggerCode)
    .single();

  if (!trigger || !trigger.is_active) {
    console.warn(`[Notification Pipeline] Trigger ${opts.triggerCode} is missing or inactive.`);
    return null;
  }

  const { data: queueItem, error } = await supabase
    .from('notification_queue')
    .insert({
      trigger_id: trigger.id,
      alumni_email: opts.alumniEmail.trim().toLowerCase(),
      related_entity_type: opts.relatedEntityType || null,
      related_entity_id: opts.relatedEntityId || null,
      context: opts.context || {},
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    console.error('[Notification Pipeline] Error enqueueing notification:', error);
    return null;
  }

  return queueItem;
}

export async function processQueueItem(queueItemId: string) {
  const supabase = createAdminClient();

  // Fetch settings
  const { data: settings } = await supabase
    .from('notification_provider_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (settings?.kill_switch) {
    console.warn('[Notification Pipeline] Kill switch is active. Halting send execution.');
    return { success: false, reason: 'kill_switch_active' };
  }

  // Fetch queue item with trigger and template
  const { data: queueItem, error } = await supabase
    .from('notification_queue')
    .select(`
      *,
      trigger:notification_triggers!inner(
        id, code, module, is_active,
        template:notification_templates!inner(*)
      )
    `)
    .eq('id', queueItemId)
    .single();

  if (error || !queueItem) {
    console.error('[Notification Pipeline] Queue item not found or missing relations:', error);
    return { success: false, reason: 'queue_item_not_found' };
  }

  const trigger = queueItem.trigger;
  const template = trigger.template;
  const alumniEmail = queueItem.alumni_email;

  // Gate check
  const gate = await checkSendEligibility(alumniEmail, trigger.id);

  if (!gate.allowed) {
    // Record skipped send
    await supabase.from('notification_queue').update({
      status: 'skipped_suppressed',
      processed_at: new Date().toISOString(),
    }).eq('id', queueItemId);

    await supabase.from('notification_sends').insert({
      queue_id: queueItemId,
      template_id: template.id,
      trigger_id: trigger.id,
      alumni_email: alumniEmail,
      recipient_email: alumniEmail,
      subject_rendered: template.subject_template,
      status: 'failed',
      skip_reason: gate.skipReason || 'unsubscribed',
      provider: settings?.active_provider || 'dry_run',
      tracking_token: crypto.randomUUID(),
    });

    return { success: false, reason: gate.skipReason };
  }

  const trackingToken = crypto.randomUUID();

  // Render email with error handling for missing template variables
  let rendered: { subject: string; html: string };
  try {
    rendered = renderEmailTemplate({
      subjectTemplate: template.subject_template,
      bodyHtmlTemplate: template.body_html_template,
      context: queueItem.context || {},
      alumniEmail,
      trackingToken,
      module: template.module,
    });
  } catch (renderError: any) {
    const errorMessage = renderError?.message || 'Template rendering failed due to missing variables';
    console.error('[Notification Pipeline] Render failure:', errorMessage);

    // Update queue item status to failed
    await supabase.from('notification_queue').update({
      status: 'failed',
      processed_at: new Date().toISOString(),
    }).eq('id', queueItemId);

    // Record send failure in notification_sends log
    await supabase.from('notification_sends').insert({
      queue_id: queueItemId,
      template_id: template.id,
      trigger_id: trigger.id,
      alumni_email: alumniEmail,
      recipient_email: alumniEmail,
      subject_rendered: template.subject_template,
      status: 'failed',
      error_message: errorMessage,
      provider: settings?.active_provider || 'dry_run',
      tracking_token: trackingToken,
    });

    return { success: false, error: errorMessage };
  }

  // Handle sandbox mode redirect
  let finalRecipient = alumniEmail;
  let finalSubject = rendered.subject;

  if (settings?.sandbox_mode && settings?.sandbox_redirect_email) {
    finalRecipient = settings.sandbox_redirect_email;
    finalSubject = `[SANDBOX to ${alumniEmail}] ${rendered.subject}`;
  }

  const fromName = settings?.from_name || 'NGConnect';
  const fromEmail = settings?.from_email || 'notifications@navgurukul.org';
  const fromHeader = `"${fromName}" <${fromEmail}>`;

  // Dispatch send
  const sendResult = await sendEmailViaDispatcher(
    {
      to: finalRecipient,
      from: fromHeader,
      replyTo: settings?.reply_to || undefined,
      subject: finalSubject,
      html: rendered.html,
    },
    settings?.active_provider
  );

  let loggedInteractionId: string | null = null;

  // Log back to CRM if CRM module
  if (sendResult.success && template.module === 'crm') {
    try {
      // Find outcome ID for email_sent
      const { data: outcome } = await supabase
        .from('interaction_outcomes')
        .select('id')
        .eq('code', 'email_sent')
        .maybeSingle();

      if (outcome) {
        const { data: interaction } = await supabase
          .from('alumni_interactions')
          .insert({
            alumni_email: alumniEmail,
            interaction_channel: 'email',
            outcome_id: outcome.id,
            logged_by: 'system:notifications',
            notes: `[System Notification: ${template.code}] ${rendered.subject}`,
          })
          .select('id')
          .single();

        if (interaction) {
          loggedInteractionId = interaction.id;
        }
      }
    } catch (crmErr) {
      console.error('[Notification Pipeline] Error logging back to CRM interactions:', crmErr);
    }
  }

  // Update queue item
  await supabase
    .from('notification_queue')
    .update({
      status: sendResult.success ? 'sent' : 'failed',
      processed_at: new Date().toISOString(),
    })
    .eq('id', queueItemId);

  // Insert send log
  await supabase.from('notification_sends').insert({
    queue_id: queueItemId,
    template_id: template.id,
    trigger_id: trigger.id,
    alumni_email: alumniEmail,
    recipient_email: finalRecipient,
    subject_rendered: rendered.subject,
    status: sendResult.success ? 'sent' : 'failed',
    error_message: sendResult.error || null,
    provider: sendResult.providerUsed,
    provider_message_id: sendResult.providerMessageId || null,
    tracking_token: trackingToken,
    logged_interaction_id: loggedInteractionId,
  });

  return {
    success: sendResult.success,
    providerMessageId: sendResult.providerMessageId,
    previewUrl: sendResult.previewUrl,
    error: sendResult.error,
  };
}

export async function processAllPendingQueue() {
  const supabase = createAdminClient();
  const { data: items } = await supabase
    .from('notification_queue')
    .select('id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50);

  if (!items || items.length === 0) {
    return { processed: 0 };
  }

  const results = [];
  for (const item of items) {
    const res = await processQueueItem(item.id);
    results.push(res);
  }

  return { processed: items.length, results };
}
