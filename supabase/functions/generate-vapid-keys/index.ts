import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate a proper VAPID key pair
  const vapidKeys = webpush.generateVAPIDKeys();

  return new Response(
    JSON.stringify({
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey,
      message: "Save these as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets"
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
