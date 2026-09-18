import { createServer } from "node:http";
import { tagLegalMedia, InfraiError } from "./legal_media_service.js";

createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/media/tag") { res.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(chunk as Buffer);
    const result = await tagLegalMedia(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    res.writeHead(200, {"Content-Type":"application/json"}).end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof InfraiError && error.status < 500 ? error.status : 400;
    res.writeHead(status, {"Content-Type":"application/json"}).end(JSON.stringify({ error: error instanceof Error ? error.message : "request rejected" }));
  }
}).listen(3000);
console.log("legal media service listening on http://localhost:3000");
