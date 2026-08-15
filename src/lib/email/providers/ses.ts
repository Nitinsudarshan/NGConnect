import nodemailer from 'nodemailer';
import { EmailProvider, EmailSendOptions, EmailSendResult } from '../types';

export class SesProvider implements EmailProvider {
  name: 'ses' = 'ses';

  async send(opts: EmailSendOptions): Promise<EmailSendResult> {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    // Check if credentials exist
    if (!accessKeyId || !secretAccessKey) {
      return {
        success: false,
        error: 'AWS credentials missing. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env vars.',
      };
    }

    try {
      // Use SES SMTP endpoint via Nodemailer
      const host = `email-smtp.${region}.amazonaws.com`;
      const transporter = nodemailer.createTransport({
        host,
        port: 465,
        secure: true,
        auth: {
          user: accessKeyId,
          pass: secretAccessKey,
        },
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
      console.error('[Email System - AWS SES] Error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to send via AWS SES',
      };
    }
  }
}
