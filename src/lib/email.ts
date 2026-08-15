import { sendEmailViaDispatcher } from './email/dispatcher';
import { EmailProviderType } from './email/types';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  provider?: EmailProviderType;
}

export async function sendEmail({ to, subject, html, from, replyTo, provider }: SendEmailOptions) {
  const recipientStr = Array.isArray(to) ? to.join(', ') : to;
  const defaultFrom = from || '"NGConnect" <notifications@navgurukul.org>';

  try {
    const result = await sendEmailViaDispatcher(
      {
        to: recipientStr,
        subject,
        html,
        from: defaultFrom,
        replyTo,
      },
      provider
    );

    return {
      success: result.success,
      data: {
        messageId: result.providerMessageId,
        previewUrl: result.previewUrl,
        provider: result.providerUsed,
      },
      error: result.error,
    };
  } catch (error: any) {
    console.error('Failed to send email via Dispatcher:', error);
    return { success: false, error: error?.message || error };
  }
}

export * from './email/types';
export * from './email/dispatcher';
