import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

type ProcessRequest = {
  jobId: string;
  inputUrl: string;
  filters: string[];
  filename: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: ProcessRequest = await req.json();
    const { jobId, inputUrl, filters, filename } = body;

    if (!jobId || !inputUrl || !filters || filters.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: jobId, inputUrl, filters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update job to processing
    await updateJob(jobId, {
      status: "processing",
      started_at: new Date().toISOString(),
    });

    // Build Replicate input based on filters
    const replicateInput: Record<string, unknown> = {
      video_path: inputUrl,
    };

    // Apply filter parameters
    if (filters.includes("upscale_2x")) {
      replicateInput.scale = 2;
      replicateInput.target_resolution = "4k";
    }
    if (filters.includes("deep_clean")) {
      replicateInput.denoise = true;
      replicateInput.remove_compression = true;
    }
    if (filters.includes("clear_edge")) {
      replicateInput.sharpen = true;
      replicateInput.edge_enhance = true;
    }

    let replicateId: string | null = null;
    let outputUrl: string | null = null;

    if (REPLICATE_API_KEY) {
      // Call Replicate API to create a prediction
      const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${REPLICATE_API_KEY}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          version: "zsxkib/real-esrgan",
          input: replicateInput,
        }),
      });

      if (!replicateRes.ok) {
        const errText = await replicateRes.text();
        throw new Error(`Replicate API error: ${errText}`);
      }

      const prediction = await replicateRes.json();
      replicateId = prediction.id;

      // Store replicate ID
      await updateJob(jobId, { replicate_id: replicateId });

      // If prediction completed synchronously (Prefer: wait)
      if (prediction.status === "succeeded" && prediction.output) {
        outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      } else if (prediction.status === "failed") {
        throw new Error(prediction.error ?? "Replicate prediction failed");
      }
      // If still processing, the prediction will be polled by the frontend
      // For now, mark as processing and return
    } else {
      // No API key configured — simulate a completed job for demo purposes
      outputUrl = inputUrl; // Return input as output placeholder
    }

    if (outputUrl) {
      // Job completed
      await updateJob(jobId, {
        status: "completed",
        output_url: outputUrl,
        completed_at: new Date().toISOString(),
      });

      // Send "video ready" email
      await sendEmail({
        type: "video_ready",
        email: await getUserEmail(jobId),
        filename,
        download_url: outputUrl,
      });
    }

    return new Response(
      JSON.stringify({ success: true, jobId, replicateId, status: outputUrl ? "completed" : "processing" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    // Mark job as failed
    const body = await req.clone().json().catch(() => ({}));
    if (body.jobId) {
      await updateJob(body.jobId, {
        status: "failed",
        error_message: err.message,
        completed_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function updateJob(jobId: string, updates: Record<string, unknown>) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/video_jobs?id=eq.${jobId}`, {
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

async function getUserEmail(jobId: string): Promise<string> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return "";
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/video_jobs?id=eq.${jobId}&select=user_id`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );
    const data = await res.json();
    const userId = data?.[0]?.user_id;
    if (!userId) return "";

    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users_profiles?id=eq.${userId}&select=email`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );
    const profileData = await profileRes.json();
    return profileData?.[0]?.email ?? "";
  } catch {
    return "";
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
