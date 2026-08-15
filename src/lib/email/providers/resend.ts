import { EmailProvider, EmailSendOptions, EmailSendResult } from '../types';

export class ResendProvider implements EmailProvider {
  name: 'resend' = 'resend';

  async send(opts: EmailSendOptions): Promise<EmailSendResult> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'Resend API Key missing. Please set RESEND_API_KEY environment variable.',
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: opts.from,
          to: [opts.to],
          reply_to: opts.replyTo,
          subject: opts.subject,
          html: opts.html,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data?.message || data?.error || `Resend API error (${response.status})`,
        };
      }

      return {
        success: true,
        providerMessageId: data.id,
      };
    } catch (error: any) {
      console.error('[Email System - RESEND] Error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to send via Resend API',
      };
    }
  }
}
