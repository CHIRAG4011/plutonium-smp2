import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_ADDRESS = process.env.SMTP_FROM || "Plutonium SMP <noreply@plutoniumsmp.net>";

const isConfigured = Boolean(RESEND_API_KEY);
const resend = isConfigured ? new Resend(RESEND_API_KEY) : null;

if (!isConfigured) {
  console.warn("[EMAIL] RESEND_API_KEY not set — emails will be logged to console only.");
} else {
  console.log("[EMAIL] Resend configured and ready.");
}

async function sendEmail(to: string, subject: string, html: string) {
  const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  if (!resend) {
    console.log(`[EMAIL - not configured] TO: ${to} | SUBJECT: ${subject}`);
    console.log(`[EMAIL BODY] ${plainText}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });

  if (error) {
    console.error(`[EMAIL] Resend failed to send to ${to}: ${error.message}`);
    console.log(`[EMAIL FALLBACK] TO: ${to} | SUBJECT: ${subject}`);
    console.log(`[EMAIL FALLBACK BODY] ${plainText}`);
  } else {
    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
  }
}

function brandHeader(avatarUrl?: string | null) {
  return `
  <div style="background:#ffffff;padding:24px 40px 20px;border-bottom:3px solid #22c55e;">
    <div style="display:flex;align-items:center;gap:14px;">
      <div style="background:#dcfce7;border-radius:10px;padding:8px 14px;display:inline-block;">
        <h1 style="color:#16a34a;font-family:monospace;font-size:22px;margin:0;letter-spacing:2px;">⚡ PLUTONIUM SMP</h1>
      </div>
      ${avatarUrl ? `<img src="${avatarUrl}" style="width:40px;height:40px;border-radius:50%;border:2px solid #22c55e;margin-left:auto;" alt="Avatar" />` : ""}
    </div>
    <p style="color:#6b7280;font-size:12px;margin:6px 0 0;font-family:monospace;">play.plutoniumsmp.fun</p>
  </div>
`;
}

const brandFooter = `
  <div style="background:#f0fdf4;padding:20px 40px;border-top:1px solid #bbf7d0;text-align:center;">
    <p style="color:#16a34a;font-family:monospace;font-size:13px;margin:0 0 4px;">⚡ Plutonium SMP</p>
    <p style="color:#6b7280;font-size:12px;margin:0;">© 2026 Plutonium SMP — play.plutoniumsmp.fun</p>
    <p style="color:#9ca3af;font-size:11px;margin:6px 0 0;">Minecraft Lifesteal Server • Season 2</p>
  </div>
`;

function wrapper(content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(34,197,94,0.1);">
        ${content}
      </div>
    </body>
    </html>
  `;
}

export async function sendOtpEmail(to: string, code: string, purpose: "registration" | "login", avatarUrl?: string | null) {
  const label = purpose === "registration" ? "Verify your email" : "Login verification";
  const description =
    purpose === "registration"
      ? "Use this code to verify your email and complete registration:"
      : "Use this code to verify your identity:";

  const html = wrapper(`
    ${brandHeader(avatarUrl)}
    <div style="padding:40px;">
      <div style="background:#dcfce7;border-radius:8px;padding:6px 14px;display:inline-block;margin-bottom:16px;">
        <span style="color:#16a34a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${purpose === "registration" ? "New Account" : "Security"}</span>
      </div>
      <h2 style="color:#111827;margin:0 0 12px;font-size:24px;">${label}</h2>
      <p style="color:#6b7280;font-size:15px;">${description}</p>
      <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:32px;text-align:center;margin:28px 0;">
        <div style="color:#16a34a;font-size:48px;font-family:monospace;font-weight:bold;letter-spacing:16px;">${code}</div>
        <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">This code expires in 10 minutes.</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    ${brandFooter}
  `);
  await sendEmail(to, `${code} — ${label} | Plutonium SMP`, html);
}

export async function sendCheckoutOtpEmail(to: string, username: string, code: string, avatarUrl?: string | null) {
  const html = wrapper(`
    ${brandHeader(avatarUrl)}
    <div style="padding:40px;">
      <div style="background:#dcfce7;border-radius:8px;padding:6px 14px;display:inline-block;margin-bottom:16px;">
        <span style="color:#16a34a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Order Verification</span>
      </div>
      <h2 style="color:#111827;margin:0 0 12px;font-size:24px;">Confirm Your Order</h2>
      <p style="color:#6b7280;font-size:15px;">Hi <strong style="color:#111827;">${username}</strong>, use this code to verify and place your order:</p>
      <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:32px;text-align:center;margin:28px 0;">
        <div style="color:#16a34a;font-size:48px;font-family:monospace;font-weight:bold;letter-spacing:16px;">${code}</div>
        <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">This code expires in 15 minutes.</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;">If you didn't initiate a purchase, please ignore this email.</p>
    </div>
    ${brandFooter}
  `);
  await sendEmail(to, `${code} — Order Verification | Plutonium SMP`, html);
}

export async function sendWelcomeEmail(to: string, username: string, avatarUrl?: string | null) {
  const html = wrapper(`
    ${brandHeader(avatarUrl)}
    <div style="padding:40px;">
      <div style="background:#dcfce7;border-radius:8px;padding:6px 14px;display:inline-block;margin-bottom:16px;">
        <span style="color:#16a34a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Welcome!</span>
      </div>
      <h2 style="color:#111827;margin:0 0 12px;font-size:24px;">Welcome to Plutonium SMP, ${username}! 🎮</h2>
      <p style="color:#6b7280;font-size:15px;">Your account has been created successfully. You're ready to join the ultimate Minecraft Lifesteal experience.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin:28px 0;">
        <p style="color:#16a34a;font-family:monospace;font-size:16px;margin:0 0 8px;font-weight:600;">🎮 Server IP: play.plutoniumsmp.fun</p>
        <p style="color:#6b7280;font-size:14px;margin:0;">Join our Discord to connect with the community!</p>
      </div>
      <p style="color:#6b7280;font-size:14px;">Visit <a href="https://plutoniumsmp.fun/store" style="color:#16a34a;font-weight:600;">the store</a> to grab exclusive ranks and perks.</p>
    </div>
    ${brandFooter}
  `);
  await sendEmail(to, `Welcome to Plutonium SMP, ${username}!`, html);
}

export async function sendLoginNotificationEmail(to: string, username: string, avatarUrl?: string | null) {
  const now = new Date().toUTCString();
  const html = wrapper(`
    ${brandHeader(avatarUrl)}
    <div style="padding:40px;">
      <div style="background:#fef9c3;border-radius:8px;padding:6px 14px;display:inline-block;margin-bottom:16px;">
        <span style="color:#854d0e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Security Alert</span>
      </div>
      <h2 style="color:#111827;margin:0 0 12px;font-size:24px;">New Login Detected</h2>
      <p style="color:#6b7280;font-size:15px;">A new login was detected for your account <strong style="color:#111827;">${username}</strong>.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin:28px 0;">
        <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">🕐 Time: <strong style="color:#111827;">${now}</strong></p>
      </div>
      <p style="color:#dc2626;font-size:14px;background:#fef2f2;border-radius:8px;padding:12px 16px;">⚠️ If this wasn't you, please change your password immediately and contact support on Discord.</p>
    </div>
    ${brandFooter}
  `);
  await sendEmail(to, `New Login to Your Plutonium SMP Account`, html);
}

export async function sendOrderConfirmationEmail(
  to: string,
  username: string,
  items: { name: string; price: number; quantity: number }[],
  totalUsd: number,
  discountPercent: number,
  orderId?: string,
  avatarUrl?: string | null
) {
  const itemRows = items.map(i =>
    `<tr>
      <td style="color:#374151;padding:10px 0;border-bottom:1px solid #dcfce7;">${i.name}${i.quantity > 1 ? ` <span style="color:#6b7280;font-size:12px;">x${i.quantity}</span>` : ""}</td>
      <td style="color:#111827;font-weight:600;padding:10px 0;border-bottom:1px solid #dcfce7;text-align:right;">$${(i.price * i.quantity / 100).toFixed(2)}</td>
    </tr>`
  ).join("");

  const discountRow = discountPercent > 0
    ? `<tr><td style="color:#16a34a;padding:8px 0;font-size:14px;">Discount (${discountPercent}%)</td><td style="color:#16a34a;text-align:right;font-size:14px;">-${discountPercent}%</td></tr>`
    : "";

  const orderIdBlock = orderId
    ? `<div style="background:#f0fdf4;border-radius:8px;padding:10px 16px;margin-bottom:20px;font-family:monospace;">
        <span style="color:#6b7280;font-size:12px;">ORDER ID: </span>
        <span style="color:#16a34a;font-size:13px;font-weight:600;">${orderId}</span>
      </div>`
    : "";

  const html = wrapper(`
    ${brandHeader(avatarUrl)}
    <div style="padding:40px;">
      <div style="background:#dcfce7;border-radius:8px;padding:6px 14px;display:inline-block;margin-bottom:16px;">
        <span style="color:#16a34a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Order Confirmed</span>
      </div>
      <h2 style="color:#111827;margin:0 0 8px;font-size:24px;">Order Placed Successfully! 🎉</h2>
      <p style="color:#6b7280;font-size:15px;">Hi <strong style="color:#111827;">${username}</strong>, your order has been placed and is being reviewed.</p>

      ${orderIdBlock}

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:20px 0;">
        <p style="color:#16a34a;font-weight:700;margin:0 0 16px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Order Summary</p>
        <table style="width:100%;border-collapse:collapse;">
          ${itemRows}
          ${discountRow}
          <tr>
            <td style="color:#111827;font-weight:700;padding:14px 0 0;font-size:20px;">Total</td>
            <td style="color:#16a34a;font-weight:700;padding:14px 0 0;font-size:20px;text-align:right;">$${(totalUsd / 100).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="background:#dcfce7;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#15803d;font-weight:700;margin:0 0 8px;font-size:14px;">📋 What's Next?</p>
        <p style="color:#374151;font-size:14px;margin:0;">Your order is <strong>pending payment</strong>. Please contact an admin on our Discord server to complete your payment and have your items delivered in-game.</p>
      </div>

      <p style="color:#9ca3af;font-size:13px;">Items will be delivered within 24 hours after payment confirmation.</p>
    </div>
    ${brandFooter}
  `);
  await sendEmail(to, `Order Confirmed — Plutonium SMP Store`, html);
}

export async function sendPaymentConfirmationEmail(to: string, username: string, items: string[], totalUsd: number, avatarUrl?: string | null) {
  const itemList = items.map(i => `<li style="color:#374151;padding:4px 0;">${i}</li>`).join("");
  const html = wrapper(`
    ${brandHeader(avatarUrl)}
    <div style="padding:40px;">
      <div style="background:#dcfce7;border-radius:8px;padding:6px 14px;display:inline-block;margin-bottom:16px;">
        <span style="color:#16a34a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Payment Confirmed</span>
      </div>
      <h2 style="color:#111827;margin:0 0 12px;font-size:24px;">Payment Confirmed! ✅</h2>
      <p style="color:#6b7280;font-size:15px;">Hi <strong style="color:#111827;">${username}</strong>, your payment has been confirmed.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:28px 0;">
        <p style="color:#16a34a;font-weight:700;margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Items Ordered:</p>
        <ul style="margin:0;padding-left:20px;">${itemList}</ul>
        <div style="border-top:1px solid #e5e7eb;margin-top:16px;padding-top:16px;">
          <p style="color:#16a34a;font-size:20px;font-weight:700;margin:0;">Total: $${(totalUsd / 100).toFixed(2)}</p>
        </div>
      </div>
      <p style="color:#9ca3af;font-size:13px;margin-top:16px;">Your items will be delivered in-game within 24 hours after payment verification.</p>
    </div>
    ${brandFooter}
  `);
  await sendEmail(to, `Payment Confirmed — Plutonium SMP Store`, html);
}
