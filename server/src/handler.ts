import Anthropic from "@anthropic-ai/sdk";

import { LookupInputError, LookupRefusedError, lookupNicotine } from "./lookup.ts";

/**
 * Standard fetch handler: POST /nicotine-lookup {"query": "..."} -> LookupResult.
 * Runs as-is on Cloudflare Workers, Deno, Bun or any runtime with Request/Response.
 *
 * Before going to production add per-device rate limiting (every call costs
 * real API usage) and, ideally, app attestation.
 */
export async function handleRequest(request: Request, apiKey: string | undefined): Promise<Response> {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/nicotine-lookup") {
    return json({ error: "Not found" }, 404, cors);
  }
  if (!apiKey) return json({ error: "Server non configurato." }, 500, cors);

  let query: unknown;
  try {
    ({ query } = (await request.json()) as { query?: unknown });
  } catch {
    return json({ error: "Richiesta non valida." }, 400, cors);
  }
  if (typeof query !== "string") return json({ error: "Richiesta non valida." }, 400, cors);

  try {
    const result = await lookupNicotine(query, new Anthropic({ apiKey }));
    return json(result, 200, cors);
  } catch (error) {
    if (error instanceof LookupInputError) return json({ error: error.message }, 400, cors);
    if (error instanceof LookupRefusedError) return json({ error: error.message }, 422, cors);
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: "Troppe richieste, riprova tra poco." }, 429, cors);
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error", error.status, error.message);
      return json({ error: "Servizio AI non disponibile, riprova più tardi." }, 502, cors);
    }
    console.error(error);
    return json({ error: "Errore imprevisto." }, 500, cors);
  }
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

/** Cloudflare Workers entry point (set the secret with `wrangler secret put ANTHROPIC_API_KEY`). */
export default {
  fetch(request: Request, env: { ANTHROPIC_API_KEY?: string }): Promise<Response> {
    return handleRequest(request, env.ANTHROPIC_API_KEY);
  },
};
