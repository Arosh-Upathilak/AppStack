export const createAccountTemplate = (
  name: string,
  email: string
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Account Created</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#05051d;
    font-family:Arial,sans-serif;
  "
>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#05051d;"
  >

    <tr>
      <td
        align="center"
        style="padding:40px 20px;"
      >

        <table
          width="500"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            background:#ffffff;
            border-radius:30px;
            padding:40px;
          "
        >

          <tr>
            <td align="center">

              <div
                style="
                  width:60px;
                  height:60px;
                  background:#111827;
                  border-radius:18px;
                  color:#ffffff;
                  font-size:28px;
                  font-weight:bold;
                  line-height:60px;
                  text-align:center;
                "
              >
                A
              </div>

            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="
                padding-top:30px;
                font-size:30px;
                font-weight:700;
                color:#111827;
              "
            >
              Welcome to AppStack 🎉
            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="
                padding-top:20px;
                color:#6b7280;
                font-size:16px;
                line-height:28px;
              "
            >

              Hello
              <strong>${name}</strong>,

              <br /><br />

              Thank you for creating your account.

              <br /><br />

              Your registered email is:

              <br />

              <strong>${email}</strong>

            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="padding-top:35px;"
            >

              <a
                href="http://localhost:3000/login"
                style="
                  display:inline-block;
                  background:#111827;
                  color:#ffffff;
                  text-decoration:none;
                  padding:14px 28px;
                  border-radius:12px;
                  font-size:16px;
                  font-weight:600;
                "
              >
                Login Now
              </a>

            </td>
          </tr>

        </table>

      </td>
    </tr>

  </table>

</body>
</html>
`;