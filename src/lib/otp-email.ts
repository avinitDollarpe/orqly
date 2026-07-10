/** OTP email HTML — table layout + inline styles for email-client compatibility. */
export const otpEmailHtml = (code: string) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Your Orqly sign-in code</title>
  </head>
  <body style="margin:0;padding:40px 20px;background:#070606;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table
            width="480"
            cellspacing="0"
            cellpadding="0"
            style="background:#141313;border:1px solid rgba(208,219,218,0.14);border-radius:16px;padding:36px 32px;"
          >
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <span style="display:inline-block;width:32px;height:32px;line-height:32px;border-radius:10px;background:#ff5a19;color:#070606;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:18px;font-weight:700;text-align:center;">&#8984;</span>
              </td>
            </tr>
            <tr>
              <td>
                <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#d0dbda;text-align:center;">
                  Sign in to Orqly
                </h1>

                <p style="margin:14px 0 0;color:#8fa09e;font-size:14px;line-height:1.5;text-align:center;">
                  Enter this code to continue. It expires in <strong style="color:#d0dbda;">10 minutes</strong>.
                </p>

                <div
                  style="margin-top:24px;background:#1e1e1f;border:1px solid rgba(208,219,218,0.12);border-radius:12px;padding:20px;text-align:center;"
                >
                  <p style="margin:0;color:#8fa09e;font-size:11px;font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">
                    Verification code
                  </p>

                  <p
                    style="margin:12px 0 0;font-size:36px;font-weight:700;letter-spacing:8px;color:#ff5a19;font-family:'JetBrains Mono',ui-monospace,monospace;"
                  >
                    ${code}
                  </p>
                </div>

                <p style="margin-top:24px;color:#8fa09e;font-size:13px;line-height:1.5;text-align:center;">
                  If you didn&apos;t request this, you can safely ignore this email.
                </p>

                <hr style="border:none;border-top:1px solid rgba(208,219,218,0.1);margin:28px 0 0;" />

                <p style="margin:16px 0 0;color:#6f7e7c;font-size:12px;line-height:1.5;text-align:center;">
                  Never share this code with anyone.
                </p>
              </td>
            </tr>
          </table>

          <p style="margin-top:24px;color:#6f7e7c;font-size:11px;font-family:'JetBrains Mono',ui-monospace,monospace;letter-spacing:0.06em;text-transform:uppercase;">
            Orqly &middot; API workflow builder
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
