import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials are not set. Email was not sent.", { to, subject });
    return { success: false, error: "SMTP_USER or SMTP_PASS missing" };
  }

  try {
    const info = await transporter.sendMail({
      from: '"NGConnect Learning Center" <learning@navgurukul.org>',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    });

    return { success: true, data: info };
  } catch (error) {
    console.error("Failed to send email via Nodemailer:", error);
    return { success: false, error };
  }
}
