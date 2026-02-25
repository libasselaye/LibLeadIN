/**
 * Escapes HTML special characters to prevent XSS.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates a professional HTML email from plain text subject and body.
 * The body text is sanitized and converted to HTML paragraphs.
 */
export function buildHtmlEmail(body: string): string {
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const safe = escapeHtml(p);
      const html = safe.replace(/\n/g, '<br>');
      return `<p style="margin: 0 0 16px 0; line-height: 1.7; color: #1a1a2e;">${html}</p>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header accent bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb, #1e40af); height: 6px; border-radius: 12px 12px 0 0;"></td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 44px 32px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              ${paragraphs}
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 44px 40px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e5e7eb; padding-top: 24px; width: 100%;">
                <tr>
                  <td style="padding-top: 24px;">
                    <p style="margin: 0 0 2px 0; font-size: 15px; font-weight: 600; color: #1a1a2e;">Libasse Mboup</p>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">Data Scientist / AI Engineer</p>
                    <p style="margin: 0 0 2px 0; font-size: 12px; color: #9ca3af;">&#x1F4CD; Region PACA</p>
                    <p style="margin: 0 0 2px 0; font-size: 12px; color: #9ca3af;">&#x1F4DE; 0651983614</p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">&#x1F310; <a href="https://libasse.tech" style="color: #2563eb; text-decoration: none;">libasse.tech</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 44px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af; text-align: center;">
                Cet email vous a ete envoye via LibLeadIN
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
