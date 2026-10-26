const assert = require("node:assert/strict");
const { after, beforeEach, test } = require("node:test");
const { GroqApiError, getGroqApiKey, groqFetch } = require("../groq");

const originalApiKey = process.env.GROQ_API_KEY;
const originalFetch = global.fetch;

after(() => {
  if (originalApiKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalApiKey;
  global.fetch = originalFetch;
});

beforeEach(() => {
  process.env.GROQ_API_KEY = "gsk_test_key_for_mock_requests";
  global.fetch = originalFetch;
});

test("rejects a missing or example API key with setup instructions", () => {
  delete process.env.GROQ_API_KEY;
  assert.throws(getGroqApiKey, /Set a valid GROQ_API_KEY in backend\/\.env/);

  process.env.GROQ_API_KEY = "your_groq_api_key_here";
  assert.throws(getGroqApiKey, /Set a valid GROQ_API_KEY in backend\/\.env/);
});

test("sends the configured key and maps rejected keys to a clear error", async () => {
  global.fetch = async (_url, options) => {
    assert.equal(options.headers.get("Authorization"), "Bearer gsk_test_key_for_mock_requests");
    return new Response("{}", { status: 401 });
  };

  await assert.rejects(
    groqFetch("https://api.groq.com/test"),
    (error) => error instanceof GroqApiError && /Groq rejected the API key/.test(error.message)
  );
});

test("explains network errors without hiding the connectivity cause", async () => {
  global.fetch = async () => {
    throw Object.assign(new Error("fetch failed"), {
      cause: Object.assign(new Error("DNS lookup failed"), { code: "ENOTFOUND" }),
    });
  };

  await assert.rejects(
    groqFetch("https://api.groq.com/test"),
    (error) => error instanceof GroqApiError && /Could not connect to Groq.*ENOTFOUND/.test(error.message)
  );
});
