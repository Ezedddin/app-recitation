/**
 * Thin HTTP client for our own FastAPI backend (see /server). This is the
 * ANALYSIS backend — it in turn talks to UmmahAPI for Quran data/reference
 * audio and to OpenAI for pronunciation/Tajweed scoring, but the mobile app
 * never calls either of those directly, and never holds their credentials.
 *
 * Base URL: for the iOS Simulator, `localhost` reaches the host Mac
 * directly, so the default below works out of the box when running
 * `uvicorn` locally alongside Expo. A physical device needs the Mac's LAN
 * IP instead — set EXPO_PUBLIC_API_BASE_URL to override.
 */
const DEFAULT_BASE_URL = 'http://localhost:8787';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function baseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
}

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === 'string') return body.detail;
  } catch {
    // response wasn't JSON — fall through to the generic message
  }
  return `Request failed with status ${response.status}`;
}

export async function getJSON<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed');
  }
  if (!response.ok) {
    throw new ApiError(await parseErrorDetail(response), response.status);
  }
  return response.json();
}

export async function postForm<T>(path: string, form: FormData): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, { method: 'POST', body: form });
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed');
  }
  if (!response.ok) {
    throw new ApiError(await parseErrorDetail(response), response.status);
  }
  return response.json();
}
