export const BASE_URL = "http://127.0.0.1:8000"; // Replace with your FastAPI port

export async function sendMessage(message: string) {
  const formData = new FormData();
  formData.append("message", message);

  const response = await fetch(`${BASE_URL}/chat/stream`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Failed to connect backend");

  const text = await response.text();
  return { answer: text };
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  return response.json();
}
