/**
 * Email Campaign Builder — renders section blocks into email-compatible HTML
 * Uses inline CSS for maximum email client compatibility.
 */

export type EmailSectionType = 'header' | 'text' | 'image' | 'button' | 'divider' | 'voucher-card';

export interface EmailSection {
  type: EmailSectionType;
  id: string;
  // header
  title?: string;
  subtitle?: string;
  // text
  content?: string;
  // image
  src?: string;
  alt?: string;
  width?: number;
  // button
  label?: string;
  href?: string;
  color?: string;
  // voucher-card
  voucherTitle?: string;
  voucherValue?: string;
  voucherCode?: string;
  voucherExpiry?: string;
}

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #2D2721;
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderSection(section: EmailSection): string {
  switch (section.type) {
    case 'header':
      return `
        <tr>
          <td style="padding: 32px 24px 16px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #2D2721; line-height: 1.3;">
              ${escapeHtml(section.title || '')}
            </h1>
            ${section.subtitle ? `<p style="margin: 8px 0 0 0; font-size: 16px; color: #6B5744; line-height: 1.5;">${escapeHtml(section.subtitle)}</p>` : ''}
          </td>
        </tr>`;

    case 'text':
      return `
        <tr>
          <td style="padding: 12px 24px; font-size: 16px; line-height: 1.6; color: #2D2721;">
            ${(section.content || '').replace(/\n/g, '<br />')}
          </td>
        </tr>`;

    case 'image':
      return `
        <tr>
          <td style="padding: 12px 24px; text-align: center;">
            <img
              src="${escapeHtml(section.src || '')}"
              alt="${escapeHtml(section.alt || '')}"
              width="${section.width || 560}"
              style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;"
            />
          </td>
        </tr>`;

    case 'button': {
      const btnColor = section.color || '#8B7355';
      return `
        <tr>
          <td style="padding: 16px 24px; text-align: center;">
            <a
              href="${escapeHtml(section.href || '#')}"
              style="display: inline-block; padding: 14px 32px; background-color: ${escapeHtml(btnColor)}; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; line-height: 1;"
            >
              ${escapeHtml(section.label || 'Click here')}
            </a>
          </td>
        </tr>`;
    }

    case 'divider':
      return `
        <tr>
          <td style="padding: 16px 24px;">
            <hr style="border: none; border-top: 1px solid #E8E0D8; margin: 0;" />
          </td>
        </tr>`;

    case 'voucher-card':
      return `
        <tr>
          <td style="padding: 16px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px dashed #8B7355; border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="padding: 24px; text-align: center; background-color: #FAF7F4;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B5744; text-transform: uppercase; letter-spacing: 1px;">Voucher</p>
                  <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #2D2721;">
                    ${escapeHtml(section.voucherTitle || '')}
                  </h2>
                  <p style="margin: 0 0 12px 0; font-size: 32px; font-weight: 800; color: #8B7355;">
                    ${escapeHtml(section.voucherValue || '')}
                  </p>
                  ${section.voucherCode ? `
                    <p style="margin: 0 0 8px 0; font-size: 18px; font-family: monospace; background: #fff; display: inline-block; padding: 8px 20px; border-radius: 6px; border: 1px solid #E8E0D8; color: #2D2721; letter-spacing: 2px;">
                      ${escapeHtml(section.voucherCode)}
                    </p>
                  ` : ''}
                  ${section.voucherExpiry ? `
                    <p style="margin: 8px 0 0 0; font-size: 13px; color: #9B8A7A;">
                      Valid until ${escapeHtml(section.voucherExpiry)}
                    </p>
                  ` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;

    default:
      return '';
  }
}

export function buildEmailHtml(sections: EmailSection[], options?: { previewText?: string }): string {
  const sectionHtml = sections.map(renderSection).join('\n');
  const previewText = options?.previewText || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Email</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F5F0EB; ${BASE_STYLES.trim()}">
  ${previewText ? `<div style="display:none;font-size:1px;color:#F5F0EB;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(previewText)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F0EB;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          ${sectionHtml}
          <tr>
            <td style="padding: 24px; text-align: center; font-size: 12px; color: #9B8A7A; border-top: 1px solid #E8E0D8;">
              <p style="margin: 0;">You received this email because you are a customer. <a href="{{{unsubscribe_url}}}" style="color: #8B7355;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
