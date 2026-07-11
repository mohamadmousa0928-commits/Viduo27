import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "VidEnhance AI <noreply@videnhance.ai>";

type EmailRequest = {
  type: "welcome" | "video_ready" | "vip_confirmation" | "subscription_cancelled" | "renewal_reminder";
  email: string;
  name?: string;
  // video_ready
  download_url?: string;
  filename?: string;
  // vip_confirmation / renewal_reminder / subscription_cancelled
  plan?: string;
  coins_balance?: number;
  expiry_date?: string;
  // renewal_reminder
  days_until_expiry?: number;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: EmailRequest = await req.json();

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, email } = body;
    if (!type || !email) {
      return new Response(
        JSON.stringify({ error: "Missing 'type' or 'email' in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, html } = buildEmail(body);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        JSON.stringify({ error: `Resend API error: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildEmail(body: EmailRequest): { subject: string; html: string } {
  const name = body.name || body.email.split("@")[0];

  switch (body.type) {
    case "welcome":
      return {
        subject: "Welcome to VidEnhance AI!",
        html: emailShell(`
          <h1 style="font-size:24px;color:#f9fafb;margin:0 0 16px;">Welcome to VidEnhance AI, ${escapeHtml(name)}!</h1>
          <p style="color:#9ca3af;line-height:1.6;margin:0 0 16px;">
            Your account is ready. You've been credited with <strong style="color:#f59e0b;">2.50 free coins</strong> to start enhancing your videos right away.
          </p>
          <p style="color:#9ca3af;line-height:1.6;margin:0 0 24px;">
            Please verify your email address by clicking the verification link we sent separately. Once verified, you can upload and enhance videos instantly.
          </p>
          ${button("https://videnhance.ai/#/login", "Go to Dashboard")}
          <p style="color:#6b7280;font-size:12px;margin-top:24px;">If you didn't create this account, you can safely ignore this email.</p>
        `),
      };

    case "video_ready":
      return {
        subject: "Your enhanced video is ready! 🎬",
        html: emailShell(`
          <h1 style="font-size:24px;color:#f9fafb;margin:0 0 16px;">Your video is ready, ${escapeHtml(name)}!</h1>
          <p style="color:#9ca3af;line-height:1.6;margin:0 0 16px;">
            ${escapeHtml(body.filename ?? "Your video")} has been successfully enhanced and is ready for download.
          </p>
          ${button(body.download_url ?? "https://videnhance.ai/#/profile", "Download Video")}
          <p style="color:#6b7280;font-size:12px;margin-top:24px;">This download link will expire in 7 days.</p>
        `),
      };

    case "vip_confirmation":
      return {
        subject: "VIP Subscription Activated — Welcome aboard!",
        html: emailShell(`
          <h1 style="font-size:24px;color:#f9fafb;margin:0 0 16px;">VIP Subscription Confirmed 🎉</h1>
          <p style="color:#9ca3af;line-height:1.6;margin:0 0 16px;">
            Congratulations, ${escapeHtml(name)}! Your VIP subscription is now active.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
            <tr><td style="padding:8px 0;color:#9ca3af;">Plan</td><td style="padding:8px 0;color:#f9fafb;font-weight:600;text-align:right;">${escapeHtml(body.plan ?? "VIP")}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">Coin Balance</td><td style="padding:8px 0;color:#f59e0b;font-weight:600;text-align:right;">${(body.coins_balance ?? 0).toFixed(2)} coins</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">Expires On</td><td style="padding:8px 0;color:#f9fafb;font-weight:600;text-align:right;">${escapeHtml(body.expiry_date ?? "N/A")}</td></tr>
          </table>
          ${button("https://videnhance.ai/#/profile", "View Your Profile")}
        `),
      };

    case "subscription_cancelled":
      return {
        subject: "Subscription Cancelled — We're sorry to see you go",
        html: emailShell(`
          <h1 style="font-size:24px;color:#f9fafb;margin:0 0 16px;">Subscription Cancelled</h1>
          <p style="color:#9ca3af;line-height:1.6;margin:0 0 16px;">
            Hi ${escapeHtml(name)}, your <strong style="color:#f9fafb;">${escapeHtml(body.plan ?? "VIP")}</strong> subscription has been cancelled.
          </p>
          <p style="color:#9ca3af;line-height:1.6;margin:0 0 16px;">
            Your VIP benefits remain active until <strong style="color:#f9fafb;">${escapeHtml(body.expiry_date ?? "the end of your billing period")}</strong>. After that, you'll be moved to the Free plan.
          </p>
          <p style="color:#9ca3af;line-height:1.6;margin:0 0 24px;">
            You can re-subscribe anytime. We'd love to have you back!
          </p>
          ${button("https://videnhance.ai/#/pricing", "Resubscribe")}
        `),
      };

    case "renewal_reminder":
      return {
        subject: "Your subscription renews soon — don't miss out!",
        html: emailShell(`
          <h1 style="font-size:24px;color:#f9fafb;margin:0 0 16px;">Renewal Reminder ⏰</h1>
          <p style="color:#9ca3af;line-height:1.6;margin:0 0 16px;">
            Hi ${escapeHtml(name)}, your <strong style="color:#f9fafb;">${escapeHtml(body.plan ?? "VIP")}</strong> subscription will renew in <strong style="color:#f59e0b;">${body.days_until_expiry ?? 3} days</strong>.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
            <tr><td style="padding:8px 0;color:#9ca3af;">Plan</td><td style="padding:8px 0;color:#f9fafb;font-weight:600;text-align:right;">${escapeHtml(body.plan ?? "VIP")}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">Renews On</td><td style="padding:8px 0;color:#f9fafb;font-weight:600;text-align:right;">${escapeHtml(body.expiry_date ?? "soon")}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">Coins on Renewal</td><td style="padding:8px 0;color:#f59e0b;font-weight:600;text-align:right;">${(body.coins_balance ?? 0).toFixed(0)} coins</td></tr>
          </table>
          <p style="color:#9ca3af;line-height:1.6;margin:0 0 24px;">
            Your subscription will auto-renew. You can manage or cancel anytime from your subscription page.
          </p>
          ${button("https://videnhance.ai/#/subscription", "Manage Subscription")}
        `),
      };

    default:
      return {
        subject: "VidEnhance AI Notification",
        html: emailShell(`<p style="color:#9ca3af;">You have a new notification from VidEnhance AI.</p>`),
      };
  }
}

function button(href: string, label: string): string {
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#3b82f6;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
      ${escapeHtml(label)}
    </a>
  `;
}

function emailShell(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#0a0f1e;font-family:'Inter',Arial,sans-serif;">
      <table style="width:100%;max-width:560px;margin:0 auto;padding:32px 24px;">
        <tr><td style="padding-bottom:24px;">
          <span style="font-size:18px;font-weight:700;color:#f9fafb;">VidEnhance<span style="color:#3b82f6;"> AI</span></span>
        </td></tr>
        <tr><td style="background:#111827;border-radius:16px;padding:32px;border:1px solid #1f2937;">
          ${content}
        </td></tr>
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="color:#6b7280;font-size:12px;margin:0;">© 2026 VidEnhance AI. All rights reserved.</p>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
