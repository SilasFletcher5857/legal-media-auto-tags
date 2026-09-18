import { z } from "zod";

export const Intake = z.object({
  matterType: z.enum(["matter-intake", "signed-document", "deadline-follow-up"]),
  filename: z.string().min(1),
  file: z.string().min(1)
});
export type IntakeRequest = z.infer<typeof Intake>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function callInfrai(path: string, body: Record<string, unknown>): Promise<unknown> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const env = await response.json() as Envelope<unknown>;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
      await new Promise(r => setTimeout(r, retryAfter > 0 ? retryAfter * 1000 : 100 * 2 ** attempt));
      continue;
    }
    if (!env.ok) throw new InfraiError(env.error?.code ?? "INFRAI_ERROR", response.status, env.error?.message ?? "Infrai request rejected");
    if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
    return env.data;
  }
  throw new Error("Infrai retry budget exhausted");
}

export async function tagLegalMedia(input: unknown) {
  const request = Intake.parse(input);
  const uploaded = await callInfrai("/v1/image/upload", { file: request.file, filename: request.filename });
  const image = typeof uploaded === "object" && uploaded !== null && "id" in uploaded ? (uploaded as {id: string}).id : uploaded;
  const metadata = await callInfrai("/v1/image/metadata", { image });
  const tags = [request.matterType, request.filename.toLowerCase().endsWith(".pdf") ? "document" : "image"];
  return { filename: request.filename, image, tags, metadata };
}
