// src/api/backend.ts
const BASE_URL = "http://127.0.0.1:5000";

export async function sendMessage(message: string, target_lang: string) {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, target_lang }),
  });
  return response.json();
}

export async function uploadDocument(filename: string, content: string) {
  const response = await fetch(`${BASE_URL}/api/upload_doc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, content }),
  });
  return response.json();
}

export async function resetContext() {
  const response = await fetch(`${BASE_URL}/api/reset_context`, {
    method: "POST",
  });
  return response.json();
}
