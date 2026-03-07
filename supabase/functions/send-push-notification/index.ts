import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push crypto utilities for VAPID
async function generatePushPayload(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
) {
  // Use the web-push compatible approach via fetch to the push endpoint
  // For simplicity, we'll use a raw fetch with VAPID JWT

  const jwt = await createVapidJwt(subscription.endpoint, vapidPublicKey, vapidPrivateKey, vapidSubject);

  // Encrypt the payload using Web Crypto API
  const encrypted = await encryptPayload(subscription.keys.p256dh, subscription.keys.auth, payload);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "Content-Length": encrypted.body.byteLength.toString(),
      TTL: "86400",
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    },
    body: encrypted.body,
  });

  return response;
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createVapidJwt(
  endpoint: string,
  publicKey: string,
  privateKey: string,
  subject: string
): Promise<string> {
  const origin = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: origin,
    exp: now + 12 * 3600,
    sub: subject,
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privKeyBytes = base64UrlDecode(privateKey);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    convertRawPrivateKeyToPKCS8(privKeyBytes),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s
  const rawSig = derToRaw(new Uint8Array(signature));
  const sigB64 = base64UrlEncode(rawSig);

  return `${unsignedToken}.${sigB64}`;
}

function convertRawPrivateKeyToPKCS8(rawKey: Uint8Array): ArrayBuffer {
  // PKCS8 wrapper for EC P-256 private key
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const pkcs8Footer = new Uint8Array([
    0xa1, 0x44, 0x03, 0x42, 0x00,
  ]);

  // We only have the 32-byte raw key, we need to construct without public key
  const result = new Uint8Array(pkcs8Header.length + 32);
  result.set(pkcs8Header);
  result.set(rawKey.slice(0, 32), pkcs8Header.length);
  return result.buffer;
}

function derToRaw(der: Uint8Array): Uint8Array {
  // If already raw (64 bytes), return as-is
  if (der.length === 64) return der;

  // Parse DER sequence
  const raw = new Uint8Array(64);
  let offset = 2; // skip SEQUENCE tag and length

  // Parse R
  if (der[offset] !== 0x02) return der;
  offset++;
  const rLen = der[offset++];
  const rStart = offset + (rLen - 32 > 0 ? rLen - 32 : 0);
  const rDest = 32 - Math.min(rLen, 32);
  raw.set(der.slice(rStart, rStart + Math.min(rLen, 32)), rDest);
  offset += rLen;

  // Parse S
  if (der[offset] !== 0x02) return der;
  offset++;
  const sLen = der[offset++];
  const sStart = offset + (sLen - 32 > 0 ? sLen - 32 : 0);
  const sDest = 32 + 32 - Math.min(sLen, 32);
  raw.set(der.slice(sStart, sStart + Math.min(sLen, 32)), sDest);

  return raw;
}

async function encryptPayload(
  p256dhKey: string,
  authSecret: string,
  payload: string
): Promise<{ body: Uint8Array }> {
  const clientPublicKey = base64UrlDecode(p256dhKey);
  const clientAuth = base64UrlDecode(authSecret);
  const plaintext = new TextEncoder().encode(payload);

  // Generate local key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientKey },
      localKeyPair.privateKey,
      256
    )
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF for auth info
  const authInfo = concatBuffers(
    new TextEncoder().encode("WebPush: info\0"),
    clientPublicKey,
    localPublicKeyRaw
  );

  const ikmKey = await crypto.subtle.importKey("raw", sharedSecret, { name: "HKDF" }, false, [
    "deriveBits",
  ]);

  const authKdfSalt = await crypto.subtle.importKey("raw", clientAuth, { name: "HKDF" }, false, [
    "deriveBits",
  ]);

  // PRK from auth
  const prk = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: clientAuth, info: authInfo },
      ikmKey,
      256
    )
  );

  // Derive CEK
  const cekInfo = concatBuffers(new TextEncoder().encode("Content-Encoding: aes128gcm\0"));
  const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HKDF" }, false, [
    "deriveBits",
  ]);
  const cek = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: salt, info: cekInfo },
      prkKey,
      128
    )
  );

  // Derive nonce
  const nonceInfo = concatBuffers(new TextEncoder().encode("Content-Encoding: nonce\0"));
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: salt, info: nonceInfo },
      prkKey,
      96
    )
  );

  // Pad plaintext (add delimiter 0x02)
  const paddedPlaintext = concatBuffers(plaintext, new Uint8Array([2]));

  // AES-128-GCM encrypt
  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      aesKey,
      paddedPlaintext
    )
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = 4096;
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, rs);

  const header = concatBuffers(
    salt,
    rsBytes,
    new Uint8Array([localPublicKeyRaw.length]),
    localPublicKeyRaw
  );

  return { body: concatBuffers(header, encrypted) };
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

// Main handler
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { recipientIds, title, body, url } = await req.json();

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "recipientIds required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch push subscriptions for recipients
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", recipientIds);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title: title || "☽ L'Ordre des Ombres",
      body: body || "Nouveau message reçu.",
      icon: "/favicon.ico",
      data: { url: url || "/messages" },
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const response = await generatePushPayload(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          "mailto:ordre@lovable.app"
        );

        if (response.status === 201 || response.status === 200) {
          sent++;
        } else if (response.status === 410 || response.status === 404) {
          // Subscription expired, remove it
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          failed++;
        } else {
          const text = await response.text();
          console.error(`Push failed (${response.status}):`, text);
          failed++;
        }
      } catch (e) {
        console.error("Push error:", e);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ sent, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Handler error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
