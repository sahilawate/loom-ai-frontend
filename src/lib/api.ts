// Uses the Render URL in production, defaults to localhost for dev
export const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";

export async function post(path: string, body: any) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      throw new Error("Server returned HTML. Check Backend Port.");
    }

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("API POST Failed:", err);
    throw err;
  }
}