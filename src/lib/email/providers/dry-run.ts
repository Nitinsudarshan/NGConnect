import { EmailProvider, EmailSendOptions, EmailSendResult } from '../types';

export class DryRunProvider implements EmailProvider {
  name: 'dry_run' = 'dry_run';

  async send(opts: EmailSendOptions): Promise<EmailSendResult> {
    const mockId = `dry_run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[Email System - DRY RUN] Simulated email send:`, {
      providerMessageId: mockId,
      to: opts.to,
      from: opts.from,
      replyTo: opts.replyTo,
      subject: opts.subject,
      contentLength: opts.html.length,
    });

    return {
      success: true,
      providerMessageId: mockId,
    };
  }
}
