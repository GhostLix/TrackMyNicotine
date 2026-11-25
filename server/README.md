# TrackMyNicotine – backend ricerca AI

Piccolo servizio che riceve il nome di un prodotto, cerca online le sue specifiche
con Claude (ricerca web) e restituisce un JSON con mg/ml, ml, tiri, ecc.
I mg per tiro li calcola poi l'app con lo stesso modello del catalogo
(`src/data/nicotine-model.ts`).

Serve perché **la chiave API di Anthropic non può stare dentro l'app**: chiunque
la estrarrebbe dall'APK.

## API

`POST /nicotine-lookup` con body `{"query": "Elf Bar 600 mirtillo"}` →
`200` con il JSON descritto da `LookupResultSchema` in `src/lookup.ts`,
oppure `{"error": "..."}` con status 400/422/429/502/500.

## Provarlo in locale

```bash
cd server
npm install
ANTHROPIC_API_KEY=sk-ant-... npm run dev
```

Poi avvia l'app puntando al server:

```bash
EXPO_PUBLIC_AI_LOOKUP_URL=http://<ip-del-pc>:8787 npx expo start
```

(Sul telefono `localhost` è il telefono stesso: usa l'IP del computer nella rete locale.)

## Pubblicarlo (Cloudflare Workers)

`src/handler.ts` esporta un handler `fetch` standard, quindi gira su Cloudflare
Workers, Deno Deploy o Bun senza modifiche.

```bash
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy src/handler.ts --name trackmynicotine-ai --compatibility-date 2026-11-01 --compatibility-flags nodejs_compat
```

Poi imposta `EXPO_PUBLIC_AI_LOOKUP_URL` con l'URL del worker nella build EAS.

## Prima della pubblicazione sul Play Store

- **Limite di richieste per dispositivo**: ogni ricerca costa (due chiamate al modello,
  fino a 5 ricerche web). Senza un limite chiunque può consumare il tuo credito.
- **Modello**: usa `claude-opus-5-5` con effort `low`. Se i costi pesano, valuta un
  modello più economico misurando prima la qualità delle risposte.
- **Refusal fallback** attivo (`fallbacks: "default"`): se il modello rifiuta, l'API
  riprova su un modello di riserva nella stessa chiamata.
