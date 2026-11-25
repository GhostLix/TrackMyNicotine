// Local development server: `ANTHROPIC_API_KEY=... npm run dev` -> http://localhost:8787/nicotine-lookup
import { createServer } from "node:http";

import { handleRequest } from "./handler.ts";

const PORT = Number(process.env.PORT ?? 8787);

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks);

  const request = new Request(`http://localhost:${PORT}${req.url ?? "/"}`, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: req.method === "GET" || req.method === "HEAD" || body.length === 0 ? undefined : body,
  });
  const response = await handleRequest(request, process.env.ANTHROPIC_API_KEY);

  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(PORT, () => {
  console.log(`AI lookup server on http://localhost:${PORT}/nicotine-lookup`);
});
