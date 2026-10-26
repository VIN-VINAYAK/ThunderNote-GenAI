export const BASE_URL = "http://localhost:5000";

export function getAiErrorMessage(error, fallback) {
  if (error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message)) {
    return "Unable to reach the backend. Make sure it is running and try again.";
  }
  return error.message || fallback;
}
