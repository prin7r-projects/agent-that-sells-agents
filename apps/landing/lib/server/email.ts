// Email service — Phase 3 (docs/13 Phase 3 Task 6)
// Supports Postmark and Resend for transactional email.

const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY?.trim();
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();
const FROM_EMAIL = process.env.FROM_EMAIL ?? "hello@stampedagents.com";
const FROM_NAME = process.env.FROM_NAME ?? "StampedAgents";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tag?: string;
}

/**
 * Send an email via Postmark or Resend.
 * Prefers Postmark if configured, falls back to Resend.
 */
export async function sendEmail(params: EmailParams): Promise<{ ok: boolean; provider: string; messageId?: string; error?: string }> {
  if (POSTMARK_API_KEY) {
    return sendViaPostmark(params);
  }
  if (RESEND_API_KEY) {
    return sendViaResend(params);
  }

  console.warn("[EMAIL] No email provider configured (POSTMARK_API_KEY or RESEND_API_KEY)");
  return { ok: false, provider: "none", error: "No email provider configured" };
}

async function sendViaPostmark(params: EmailParams): Promise<{ ok: boolean; provider: string; messageId?: string; error?: string }> {
  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_API_KEY!,
      },
      body: JSON.stringify({
        From: `${FROM_NAME} <${FROM_EMAIL}>`,
        To: params.to,
        Subject: params.subject,
        HtmlBody: params.html,
        TextBody: params.text ?? stripHtml(params.html),
        Tag: params.tag ?? "transactional",
        MessageStream: "outbound",
      }),
    });

    const data = await response.json() as { MessageID?: string; ErrorCode?: string; Message?: string };

    if (response.ok) {
      console.log(`[EMAIL] Postmark sent to=${params.to} messageId=${data.MessageID}`);
      return { ok: true, provider: "postmark", messageId: data.MessageID };
    }

    console.error(`[EMAIL] Postmark error: ${data.ErrorCode} - ${data.Message}`);
    return { ok: false, provider: "postmark", error: data.Message };
  } catch (err) {
    console.error("[EMAIL] Postmark request failed:", err);
    return { ok: false, provider: "postmark", error: String(err) };
  }
}

async function sendViaResend(params: EmailParams): Promise<{ ok: boolean; provider: string; messageId?: string; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text ?? stripHtml(params.html),
        tags: params.tag ? [{ name: "category", value: params.tag }] : undefined,
      }),
    });

    const data = await response.json() as { id?: string; message?: string };

    if (response.ok) {
      console.log(`[EMAIL] Resend sent to=${params.to} messageId=${data.id}`);
      return { ok: true, provider: "resend", messageId: data.id };
    }

    console.error(`[EMAIL] Resend error: ${data.message}`);
    return { ok: false, provider: "resend", error: data.message };
  } catch (err) {
    console.error("[EMAIL] Resend request failed:", err);
    return { ok: false, provider: "resend", error: String(err) };
  }
}

/**
 * Send magic-link onboarding email after purchase.
 */
export async function sendMagicLinkEmail(params: {
  to: string;
  magicLinkUrl: string;
  agentName: string;
  tier: string;
}): Promise<{ ok: boolean; provider: string; messageId?: string; error?: string }> {
  const subject = `Welcome to StampedAgents — Your ${params.agentName} license is ready`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 24px; font-weight: 700; margin: 0;">Welcome to StampedAgents</h1>
  </div>

  <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px;">Your <strong>${params.agentName}</strong> license (${params.tier} tier) has been activated.</p>
    <p style="margin: 0;">Click below to access your dashboard and start using your agent:</p>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${params.magicLinkUrl}" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600;">Access Your Dashboard</a>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 32px;">
    <p style="font-size: 14px; color: #6b7280; margin: 0;">This link expires in 24 hours. If you didn't make this purchase, please ignore this email.</p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: params.to,
    subject,
    html,
    tag: "magic-link",
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
