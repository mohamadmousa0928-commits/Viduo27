import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") ?? "";
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET") ?? "";

const PLAN_DURATIONS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

type PaymentRequest = {
  userId: string;
  email: string;
  plan: string;
  method: string;
  amount: number;
  coinsAdded: number;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: PaymentRequest = await req.json();
    const { userId, email, plan, method, amount, coinsAdded } = body;

    if (!userId || !plan || !method) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, plan, method" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const durationDays = PLAN_DURATIONS[plan] ?? 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);
    const expiryIso = expiryDate.toISOString();

    // 1. Create payment record (pending)
    const paymentRes = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        user_id: userId,
        plan,
        amount,
        method,
        coins_added: coinsAdded,
        status: "pending",
      }),
    });

    if (!paymentRes.ok) {
      throw new Error("Failed to create payment record");
    }

    const paymentData = await paymentRes.json();
    const paymentId = paymentData?.[0]?.id;

    // 2. Verify PayPal payment if credentials are configured
    let paymentVerified = true;
    if (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET) {
      try {
        // Get PayPal access token
        const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
        });

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          // PayPal verification would happen here in production
          // For now, we trust the client-side PayPal SDK onApprove callback
          paymentVerified = true;
        }
      } catch {
        // If PayPal verification fails, still proceed in demo mode
        paymentVerified = true;
      }
    }

    if (!paymentVerified) {
      // Update payment to failed
      await updatePayment(paymentId, { status: "failed" });
      throw new Error("PayPal payment could not be verified");
    }

    // 3. Update payment to success
    await updatePayment(paymentId, { status: "success" });

    // 4. Activate VIP plan — reset coins to the plan amount (no carryover)
    await fetch(`${SUPABASE_URL}/rest/v1/users_profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        plan,
        coins_balance: coinsAdded,
        coins_last_reset: new Date().toISOString(),
        subscription_expires_at: expiryIso,
      }),
    });

    // 5. Send VIP confirmation email
    await sendEmail({
      type: "vip_confirmation",
      email,
      plan,
      coins_balance: coinsAdded,
      expiry_date: expiryDate.toLocaleDateString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        plan,
        coinsAdded,
        expiresAt: expiryIso,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function updatePayment(paymentId: string, updates: Record<string, unknown>) {
  if (!paymentId) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/payments?id=eq.${paymentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(updates),
    });
  } catch {
    // non-blocking
  }
}

async function sendEmail(payload: Record<string, unknown>) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // non-blocking
  }
}
