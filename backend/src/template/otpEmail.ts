export const otpTemplate = (otp: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AppStack Verification Email</title>
</head>

<body style="margin:0;padding:0;background:#05051d;font-family:Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#05051d;">
    <tr>
      <td align="center" style="padding:40px 20px;">

        <table width="500" cellpadding="0" cellspacing="0" border="0"
          style="
            background:#ffffff;
            border-radius:30px;
            padding:40px;
          ">

          <!-- Logo -->
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center"
                    style="
                      width:60px;
                      height:60px;
                      background:#111827;
                      border-radius:18px;
                      color:#ffffff;
                      font-size:28px;
                      font-weight:bold;
                      line-height:60px;
                    "
                  >
                    A
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center"
              style="
                padding-top:30px;
                font-size:30px;
                font-weight:700;
                color:#111827;
                line-height:40px;
              "
            >
              Your Signup Verification Code
            </td>
          </tr>

          <!-- Subtitle -->
          <tr>
            <td align="center"
              style="
                padding-top:12px;
                font-size:16px;
                color:#6b7280;
                line-height:24px;
              "
            >
              Use the verification code below to complete your signup.
            </td>
          </tr>

          <!-- OTP -->
          <tr>
            <td align="center" style="padding-top:35px;">

              <table cellpadding="0" cellspacing="8" border="0" align="center">
                <tr>

                  ${otp
                    .split("")
                    .map(
                      (digit) => `
                        <td
                          align="center"
                          valign="middle"
                          width="55"
                          height="55"
                          style="
                            width:55px;
                            height:55px;
                            border:1px solid #e5e7eb;
                            border-radius:12px;
                            background:#ffffff;
                            font-size:28px;
                            font-weight:700;
                            color:#111827;
                            text-align:center;
                            vertical-align:middle;
                            line-height:55px;
                          "
                        >
                          ${digit}
                        </td>
                      `
                    )
                    .join("")}

                </tr>
              </table>

            </td>
          </tr>

          <!-- Expire -->
          <tr>
            <td align="center"
              style="
                padding-top:20px;
                font-size:15px;
                color:#ef4444;
                font-weight:600;
              "
            >
              This code will expire in 5 minutes
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
              style="
                padding-top:35px;
                color:#6b7280;
                font-size:14px;
                line-height:22px;
              "
            >
              This is an automated message.
              <strong>Please do not reply.</strong>
            </td>
          </tr>

          <!-- Brand -->
          <tr>
            <td align="center"
              style="
                padding-top:35px;
                color:#9ca3af;
                font-size:13px;
              "
            >
              © ${new Date().getFullYear()} AppStack. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;