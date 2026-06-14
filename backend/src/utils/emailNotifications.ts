import { transporter } from "./nodeMailer";

type TransactionEmailArgs = {
  to?: string | null;
  subject: string;
  title: string;
  message: string;
  details?: Record<string, string | number | null | undefined>;
};

function renderDetails(details?: TransactionEmailArgs["details"]) {
  const rows = Object.entries(details ?? {}).filter(([, value]) => value !== null && value !== undefined);
  if (!rows.length) return "";

  return `
    <table style="width:100%;border-collapse:collapse;margin-top:18px">
      ${rows.map(([label, value]) => `
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:13px">${label}</td>
          <td style="padding:8px 0;color:#0f172a;font-size:13px;text-align:right;font-weight:600">${String(value)}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export async function sendTransactionEmail(args: TransactionEmailArgs) {
  if (!args.to) return;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: args.to,
      subject: args.subject,
      html: `
        <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
            <div style="font-size:13px;color:#2563eb;font-weight:700;margin-bottom:10px">AppStack</div>
            <h1 style="font-size:20px;line-height:1.3;color:#0f172a;margin:0 0 12px">${args.title}</h1>
            <p style="font-size:14px;line-height:1.6;color:#334155;margin:0">${args.message}</p>
            ${renderDetails(args.details)}
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send transaction email:", error);
  }
}
