// Automatically uses the production URL from Vercel/Render, or defaults to local
export const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";

/**
 * Standard GET request helper
 */
export async function get(path: string) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`API GET Error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("API GET Failed:", err);
    throw err;
  }
}

/**
 * Standard POST request helper
 */
export async function post(path: string, body: any) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      throw new Error("Server returned HTML instead of JSON. Check your Backend URL configuration.");
    }

    if (!res.ok) {
      throw new Error(`API POST Error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("API POST Failed:", err);
    throw err;
  }
}