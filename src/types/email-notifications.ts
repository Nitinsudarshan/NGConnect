export type NotificationModule = 'crm' | 'learning_center';

export type NotificationEventType =
  | 'pipeline_stage_change'
  | 'interaction_outcome_logged'
  | 'followup_due'
  | 'session_reminder'
  | 'session_cancelled'
  | 'custom';

export type EmailProviderType = 'dry_run' | 'ethereal' | 'gmail_smtp' | 'ses' | 'resend';

export type QueueStatus = 'pending' | 'sent' | 'failed' | 'skipped_suppressed';

export type SendStatus = 'sent' | 'failed';

export type SkipReason = 'unsubscribed' | 'do_not_contact' | 'inactive_email' | 'duplicate_recent_send';

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  providerMessageId?: string;
  previewUrl?: string; // For Ethereal SMTP test links
  error?: string;
}

export interface EmailProvider {
  name: EmailProviderType;
  send(opts: EmailSendOptions): Promise<EmailSendResult>;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  module: NotificationModule;
  subject_template: string;
  body_html_template: string;
  variables_hint: string | null;
  is_active: boolean;
  archived_at: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationTrigger {
  id: string;
  code: string;
  module: NotificationModule;
  event_type: NotificationEventType;
  conditions: Record<string, any>;
  template_id: string;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  template?: NotificationTemplate;
}

export interface NotificationQueueItem {
  id: string;
  trigger_id: string | null;
  alumni_email: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  context: Record<string, any>;
  status: QueueStatus;
  created_at: string;
  processed_at: string | null;
}

export interface NotificationSendLog {
  id: string;
  queue_id: string | null;
  template_id: string | null;
  trigger_id: string | null;
  alumni_email: string | null;
  recipient_email: string;
  subject_rendered: string | null;
  status: SendStatus;
  skip_reason: SkipReason | null;
  error_message: string | null;
  provider: EmailProviderType;
  provider_message_id: string | null;
  tracking_token: string;
  opened_at: string | null;
  open_count: number;
  bounced_at: string | null;
  bounce_reason: string | null;
  logged_interaction_id: string | null;
  sent_at: string;
  // Joins
  template?: NotificationTemplate;
  trigger?: NotificationTrigger;
  alumni?: {
    full_name?: string;
    campus?: string;
    program?: string;
  };
}

export interface NotificationProviderSettings {
  id: number;
  active_provider: EmailProviderType;
  from_name: string;
  from_email: string | null;
  reply_to: string | null;
  sandbox_mode: boolean;
  sandbox_redirect_email: string | null;
  kill_switch: boolean;
  ses_region: string | null;
  updated_at: string;
}
