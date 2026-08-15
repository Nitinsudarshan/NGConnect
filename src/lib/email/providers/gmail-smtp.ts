import nodemailer from 'nodemailer';
import { EmailProvider, EmailSendOptions, EmailSendResult } from '../types';

export class GmailSmtpProvider implements EmailProvider {
  name: 'gmail_smtp' = 'gmail_smtp';

  async send(opts: EmailSendOptions): Promise<EmailSendResult> {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      return {
        success: false,
        error: 'SMTP credentials missing. Please set SMTP_USER and SMTP_PASS environment variables.',
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from: opts.from,
        to: opts.to,
        replyTo: opts.replyTo,
        subject: opts.subject,
        html: opts.html,
      });

      return {
        success: true,
        providerMessageId: info.messageId,
      };
    } catch (error: any) {
      console.error('[Email System - GMAIL SMTP] Error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to send via Gmail SMTP',
      };
    }
  }
}
