import nodemailer from 'nodemailer';
import { EmailProvider, EmailSendOptions, EmailSendResult } from '../types';

export class EtherealProvider implements EmailProvider {
  name: 'ethereal' = 'ethereal';

  async send(opts: EmailSendOptions): Promise<EmailSendResult> {
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await transporter.sendMail({
        from: opts.from,
        to: opts.to,
        replyTo: opts.replyTo,
        subject: opts.subject,
        html: opts.html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      console.log(`[Email System - ETHEREAL] Message sent. Preview URL: ${previewUrl}`);

      return {
        success: true,
        providerMessageId: info.messageId,
        previewUrl,
      };
    } catch (error: any) {
      console.error('[Email System - ETHEREAL] Error sending test mail:', error);
      return {
        success: false,
        error: error?.message || 'Failed to send via Ethereal SMTP',
      };
    }
  }
}
