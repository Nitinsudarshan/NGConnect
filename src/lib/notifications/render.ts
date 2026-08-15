import { generateUnsubscribeToken } from './tokens';

export class MissingTemplateVariableError extends Error {
  missingVariables: string[];

  constructor(missingVariables: string[]) {
    super(`Missing template variables: ${missingVariables.join(', ')}`);
    this.name = 'MissingTemplateVariableError';
    this.missingVariables = missingVariables;
  }
}

export interface RenderOptions {
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  context: Record<string, any>;
  alumniEmail: string;
  trackingToken: string;
  module?: 'crm' | 'learning_center';
  includeUnsubscribe?: boolean;
}

export function renderEmailTemplate({
  subjectTemplate,
  bodyHtmlTemplate,
  context,
  alumniEmail,
  trackingToken,
  module = 'crm',
  includeUnsubscribe = true,
}: RenderOptions): { subject: string; html: string } {
  let subject = subjectTemplate;
  let html = bodyHtmlTemplate;

  // Combine context variables with standard alumni tokens
  const allVars: Record<string, any> = {
    alumni_email: alumniEmail,
    ...context,
  };

  // Replace {{token_name}} placeholders
  Object.keys(allVars).forEach((key) => {
    const val = allVars[key] !== undefined && allVars[key] !== null ? String(allVars[key]) : '';
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    subject = subject.replace(regex, val);
    html = html.replace(regex, val);
  });

  // Scan for any leftover {{...}} template tokens
  const tokenRegex = /\{\{\s*([\w.]+)\s*\}\}/g;
  const missingVars = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(subject)) !== null) {
    missingVars.add(match[1]);
  }
  tokenRegex.lastIndex = 0;
  while ((match = tokenRegex.exec(html)) !== null) {
    missingVars.add(match[1]);
  }

  if (missingVars.size > 0) {
    throw new MissingTemplateVariableError(Array.from(missingVars));
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  // Render tracking pixel
  const trackingPixel = `<img src="${appUrl}/api/notifications/track/${trackingToken}/pixel.gif" width="1" height="1" style="display:none" alt="" />`;

  // Render unsubscribe link for LC broadcast templates or when requested
  let unsubscribeFooter = '';
  if (module === 'learning_center' || includeUnsubscribe) {
    const unsubToken = generateUnsubscribeToken(alumniEmail);
    const unsubUrl = `${appUrl}/api/notifications/unsubscribe?email=${encodeURIComponent(alumniEmail)}&token=${unsubToken}`;
    unsubscribeFooter = `<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; font-family: sans-serif;">
      You are receiving this email from NGConnect. <a href="${unsubUrl}" style="color: #4f46e5; text-decoration: underline;">Unsubscribe from email notifications</a>.
    </div>`;
  }

  // Inject tracking pixel and unsubscribe link into HTML body
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${unsubscribeFooter}${trackingPixel}</body>`);
  } else {
    html = `${html}${unsubscribeFooter}${trackingPixel}`;
  }

  return { subject, html };
}
