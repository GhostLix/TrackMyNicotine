import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

/**
 * What the AI returns: the product's published SPECS, not a per-puff number.
 * The app turns specs into "mg per tiro" with the same model it uses for its
 * built-in catalog (src/data/nicotine-model.ts), so AI results and catalog
 * values are always comparable.
 *
 * Keep this schema in sync with `AiLookupResult` in src/lib/ai-lookup.ts.
 */
export const LookupResultSchema = z.object({
  found: z.boolean().describe("false if the product could not be identified"),
  name: z.string().describe("Product name as sold, e.g. 'Elf Bar 600'"),
  category: z.enum(["sigarette", "rollate", "riscaldato", "usa_e_getta", "pod", "liquidi"]),
  /** Cigarettes / roll-your-own: how strong it is relative to a standard full-flavour cigarette. */
  strength: z.enum(["full", "medium", "light"]).nullable(),
  /** Heated tobacco: nicotine in the aerosol per stick (ISO), mg. */
  nicotineMgPerStick: z.number().nullable(),
  /** E-liquids, pods, disposables: nicotine concentration, mg/ml. */
  nicotineMgPerMl: z.number().nullable(),
  /** Disposables / prefilled pods: liquid capacity, ml. */
  capacityMl: z.number().nullable(),
  /** Disposables / prefilled pods: puffs declared by the maker. */
  ratedPuffs: z.number().nullable(),
  /** Open-system liquids: mouth-to-lung (mtl) or direct-to-lung (dtl). */
  vapeStyle: z.enum(["mtl", "dtl"]).nullable(),
  confidence: z.enum(["alta", "media", "bassa"]),
  /** One or two short sentences in Italian, shown to the user. */
  notes: z.string(),
  sources: z.array(z.object({ title: z.string(), url: z.string() })),
});

export type LookupResult = z.infer<typeof LookupResultSchema>;

const MODEL = "claude-opus-5-5";
const MAX_QUERY_LENGTH = 120;
const MAX_CONTINUATIONS = 3;

const RESEARCH_PROMPT = (query: string) => `You help a nicotine-tracking app identify a product a user consumes.
The user typed: <query>${query}</query>

Search the web and find the product's published specifications. Prefer the manufacturer's site or EU/Italian retailers (products sold in Italy follow the EU TPD: e-liquid max 20 mg/ml, prefilled tank max 2 ml).
Report, as applicable:
- the exact product name and its category: cigarettes, roll-your-own tobacco, heated tobacco, disposable vape, prefilled pod, or open-system e-liquid;
- cigarettes / roll-your-own: whether it is a full-flavour, medium (e.g. "Gold"/"Blue") or light/slim variant;
- heated tobacco: nicotine in the aerosol per stick (mg, ISO);
- disposables / pods: nicotine mg/ml, liquid capacity in ml, declared puffs;
- open-system liquids: nicotine mg/ml and whether it is meant for MTL or DTL vaping.
Say how confident you are and list the URLs you relied on. If you cannot identify the product, say so plainly instead of guessing.`;

const EXTRACT_PROMPT = (query: string, findings: string) => `Convert these research notes about the product "${query}" into the requested JSON.
Use null for any value the notes do not support; never invent numbers. Write "notes" in Italian, at most two short sentences, for a non-expert user. Include only URLs that appear in the notes.

<notes>
${findings}
</notes>`;

/**
 * Two calls: first research with web search (free text, so citations are
 * allowed), then extract the findings into the schema with structured outputs.
 */
export async function lookupNicotine(rawQuery: string, client = new Anthropic()): Promise<LookupResult> {
  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
  if (!query) throw new LookupInputError("Scrivi il nome del prodotto.");

  // 1. Research. Server-side fallbacks: if the model declines, the API reruns
  // the request on a fallback model inside the same call.
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: RESEARCH_PROMPT(query) }];
  let research = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
    messages,
  });
  for (let i = 0; research.stop_reason === "pause_turn" && i < MAX_CONTINUATIONS; i++) {
    // Resume the server-side search loop: resend the paused assistant turn, no extra user text.
    research = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
      messages: [...messages, { role: "assistant", content: research.content }],
    });
  }
  if (research.stop_reason === "refusal") throw new LookupRefusedError();

  const findings = research.content
    .flatMap((block) => {
      if (block.type !== "text") return [];
      const cited = (block.citations ?? [])
        .map((c) => ("url" in c && c.url ? ` [${c.title ?? "fonte"}](${c.url})` : ""))
        .join("");
      return [block.text + cited];
    })
    .join("\n");
  if (!findings.trim()) throw new Error("La ricerca non ha prodotto risultati.");

  // 2. Extract into the schema.
  const extracted = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(LookupResultSchema) },
    messages: [{ role: "user", content: EXTRACT_PROMPT(query, findings) }],
  });
  if (extracted.stop_reason === "refusal") throw new LookupRefusedError();
  if (!extracted.parsed_output) throw new Error("Risposta dell'AI non valida.");

  // Only keep https links: they are shown to the user as tappable sources.
  const result = extracted.parsed_output;
  result.sources = result.sources.filter((s) => s.url.startsWith("https://")).slice(0, 5);
  return result;
}

export class LookupInputError extends Error {}
export class LookupRefusedError extends Error {
  constructor() {
    super("L'AI non ha potuto rispondere a questa richiesta.");
  }
}
