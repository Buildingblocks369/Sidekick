// A FAKE stand-in for OpenAI's /v1/responses endpoint, for testing Sidekick for free.
// It runs on your own computer, makes no internet calls, and costs nothing.
//
// It also acts as a strict inspector: it rejects (HTTP 400) any request that breaks
// Sidekick's safety rules (store:false, service_tier:"default", output cap present),
// so a future code change that breaks them gets caught by the tests.
//
// Standalone use (for manual browser testing):
//   FAKE_KEY=sk-fake-test-key node scripts/fake-openai-server.mjs 4010
//
// Words in the LAST user message trigger special behaviour:
//   FAKE_401 FAKE_429_QUOTA FAKE_429_RATE FAKE_500 FAKE_SLOW FAKE_DELAY FAKE_REFUSAL FAKE_LONG
import http from "node:http";
import { fileURLToPath } from "node:url";

export function startFakeOpenAiServer({ port, expectedKey }) {
  const requests = []; // what Sidekick sent (metadata only)
  let counter = 0;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const json = (res, status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  const apiError = (res, status, code, message = "fake error") =>
    json(res, status, { error: { code, type: code, message } });

  const server = http.createServer(async (req, res) => {
    // Test-only inspection endpoints.
    if (req.url === "/__requests") {
      if (req.method === "DELETE") requests.length = 0;
      return json(res, 200, { requests });
    }
    if (req.method !== "POST" || req.url !== "/v1/responses") {
      return apiError(res, 404, "not_found");
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return apiError(res, 400, "invalid_json");
    }

    const authOk = req.headers.authorization === `Bearer ${expectedKey}`;
    const input = Array.isArray(body.input) ? body.input : [];
    const lastUser = [...input].reverse().find((m) => m.role === "user");
    const lastText = typeof lastUser?.content === "string" ? lastUser.content : "";

    requests.push({
      authOk,
      model: body.model,
      store: body.store,
      serviceTier: body.service_tier,
      maxOutputTokens: body.max_output_tokens,
      reasoningEffort: body.reasoning?.effort,
      safetyIdentifier: body.safety_identifier,
      inputCount: input.length,
      inputRoles: input.map((m) => m.role),
      instructions: body.instructions,
    });

    if (!authOk || lastText.includes("FAKE_401")) return apiError(res, 401, "invalid_api_key");

    // Strict inspector.
    const problems = [];
    if (body.store !== false) problems.push("store must be false");
    if (body.service_tier !== "default") problems.push('service_tier must be "default"');
    if (!(Number.isInteger(body.max_output_tokens) && body.max_output_tokens <= 1000)) {
      problems.push("max_output_tokens must be an integer <= 1000");
    }
    if (typeof body.instructions !== "string" || !body.instructions) problems.push("instructions missing");
    if (typeof body.model !== "string") problems.push("model missing");
    if (!input.every((m) => ["user", "assistant"].includes(m.role) && typeof m.content === "string")) {
      problems.push("input must be user/assistant text only");
    }
    if (typeof body.safety_identifier !== "string" || body.safety_identifier.length > 128) {
      problems.push("safety_identifier missing or too long");
    }
    if (problems.length) return apiError(res, 400, "invalid_request_error", problems.join("; "));

    if (lastText.includes("FAKE_429_QUOTA")) return apiError(res, 429, "insufficient_quota");
    if (lastText.includes("FAKE_429_RATE")) return apiError(res, 429, "rate_limit_exceeded");
    if (lastText.includes("FAKE_500")) return apiError(res, 500, "server_error");
    if (lastText.includes("FAKE_SLOW")) await sleep(6000);
    else if (lastText.includes("FAKE_DELAY")) await sleep(700);
    else await sleep(30);

    counter += 1;
    const inputChars = (body.instructions?.length ?? 0) + input.reduce((n, m) => n + m.content.length, 0);
    const usage = (text) => ({
      input_tokens: Math.ceil(inputChars / 4),
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: Math.ceil(text.length / 4),
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 0,
    });

    if (lastText.includes("FAKE_REFUSAL")) {
      return json(res, 200, {
        status: "completed",
        output: [{ type: "message", content: [{ type: "refusal", refusal: "I can't help with that." }] }],
        usage: usage("I can't help with that."),
      });
    }

    if (lastText.includes("FAKE_LONG")) {
      const text = "This is a deliberately long fake reply that gets cut off by the output cap";
      return json(res, 200, {
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        output: [{ type: "message", content: [{ type: "output_text", text }] }],
        usage: usage(text),
      });
    }

    const text = `[FAKE OPENAI SERVER] Reply #${counter}. This is a free test reply, not a real AI answer. Model: ${body.model}.`;
    return json(res, 200, {
      status: "completed",
      output: [
        { type: "reasoning", summary: [] },
        { type: "message", content: [{ type: "output_text", text }] },
      ],
      usage: usage(text),
    });
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () =>
      resolve({
        requests: async () => (await (await fetch(`http://127.0.0.1:${port}/__requests`)).json()).requests,
        reset: () => fetch(`http://127.0.0.1:${port}/__requests`, { method: "DELETE" }),
        close: () => new Promise((r) => server.close(r)),
      }),
    );
  });
}

// Run standalone?
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 4010);
  const expectedKey = process.env.FAKE_KEY || "sk-fake-test-key";
  await startFakeOpenAiServer({ port, expectedKey });
  console.log(`Fake OpenAI server on http://127.0.0.1:${port}/v1 (expects key "${expectedKey}")`);
}
