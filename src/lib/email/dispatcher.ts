import { EmailProvider, EmailSendOptions, EmailSendResult, EmailProviderType } from './types';
import { DryRunProvider } from './providers/dry-run';
import { EtherealProvider } from './providers/ethereal';
import { GmailSmtpProvider } from './providers/gmail-smtp';
import { SesProvider } from './providers/ses';
import { ResendProvider } from './providers/resend';
import { createAdminClient } from '@/lib/supabase/admin';

const providers: Record<EmailProviderType, EmailProvider> = {
  dry_run: new DryRunProvider(),
  ethereal: new EtherealProvider(),
  gmail_smtp: new GmailSmtpProvider(),
  ses: new SesProvider(),
  resend: new ResendProvider(),
};

export function getProvider(providerType: EmailProviderType): EmailProvider {
  return providers[providerType] || providers.dry_run;
}

export async function resolveActiveProviderName(): Promise<EmailProviderType> {
  // 1. Try reading DB settings
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('notification_provider_settings')
      .select('active_provider')
      .eq('id', 1)
      .single();

    if (data?.active_provider && providers[data.active_provider as EmailProviderType]) {
      return data.active_provider as EmailProviderType;
    }
  } catch (err) {
    // Fall back to env var if DB query fails
  }

  // 2. Env var fallback
  const envProvider = process.env.EMAIL_PROVIDER as EmailProviderType;
  if (envProvider && providers[envProvider]) {
    return envProvider;
  }

  // 3. Default to dry_run
  return 'dry_run';
}

export async function sendEmailViaDispatcher(
  opts: EmailSendOptions,
  providerOverride?: EmailProviderType
): Promise<EmailSendResult & { providerUsed: EmailProviderType }> {
  const activeProviderName = providerOverride || (await resolveActiveProviderName());
  const provider = getProvider(activeProviderName);

  const result = await provider.send(opts);

  return {
    ...result,
    providerUsed: activeProviderName,
  };
}
