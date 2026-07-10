/** OTP email HTML — table layout + inline styles for email-client compatibility. */
export const otpEmailHtml = (code: string) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Verification Code</title>
  </head>
  <body style="margin:0;padding:40px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table
            width="520"
            cellspacing="0"
            cellpadding="0"
            style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:40px;"
          >
            <tr>
              <td>
                <h1 style="margin:0;font-size:28px;color:#111827;">
                  Verify your email
                </h1>

                <p style="margin:20px 0;color:#6b7280;font-size:16px;line-height:24px;">
                  Enter the verification code below to continue.
                </p>

                <div
                  style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;text-align:center;"
                >
                  <p style="margin:0;color:#6b7280;font-size:14px;">
                    Your verification code
                  </p>

                  <p
                    style="margin:16px 0 0;font-size:40px;font-weight:700;letter-spacing:10px;color:#111827;font-family:monospace;"
                  >
                    ${code}
                  </p>
                </div>

                <p style="margin-top:24px;color:#6b7280;font-size:15px;line-height:24px;">
                  This code expires in <strong>10 minutes</strong>.
                </p>

                <p style="color:#6b7280;font-size:15px;line-height:24px;">
                  If you didn't request this code, you can safely ignore this email.
                </p>

                <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />

                <p style="margin:0;color:#9ca3af;font-size:13px;">
                  Never share this code with anyone.
                </p>
              </td>
            </tr>
          </table>

          <p style="margin-top:24px;color:#9ca3af;font-size:12px;">
            © 2026 Orqly. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
