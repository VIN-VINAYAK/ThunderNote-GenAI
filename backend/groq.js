class GroqApiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "GroqApiError";
    this.status = status;
  }
}

function getGroqApiKey() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || /^(your[_ -]|replace[_ -]|changeme$)/i.test(apiKey)) {
    throw new GroqApiError(
      "AI is not configured. Set a valid GROQ_API_KEY in backend/.env and restart the backend.",
      503
    );
  }
  return apiKey;
}

async function groqFetch(url, options = {}) {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${getGroqApiKey()}`);

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    const code = error.cause?.code;
    throw new GroqApiError(
      `Could not connect to Groq. Check your internet, DNS, or firewall settings${code ? ` (${code})` : ""}.`
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new GroqApiError(
      "Groq rejected the API key. Replace GROQ_API_KEY in backend/.env with a valid key, then restart the backend.",
      503
    );
  }

  return response;
}

async function groqJson(response) {
  try {
    return await response.json();
  } catch {
    throw new GroqApiError("Groq returned an unreadable response.");
  }
}

function getGroqResponseError(response, data) {
  return new GroqApiError(
    data.error?.message || `Groq request failed (HTTP ${response.status}).`
  );
}

module.exports = { GroqApiError, getGroqApiKey, getGroqResponseError, groqFetch, groqJson };
