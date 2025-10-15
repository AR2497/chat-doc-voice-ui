import { useState } from "react";
import { sendMessage, uploadDocument, resetContext } from "../../api/backend";
import { Input } from "./input"; // Update the import path since input.tsx is in the same directory
// ...existing code...
export default function Chat() {
  const [inputMessage, setInputMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ sender: string; text: string }[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("english");

  const handleSend = async () => {
    if (!inputMessage) return;

    // Update user message first
    setChatHistory([...chatHistory, { sender: "user", text: inputMessage }]);

    const data = await sendMessage(inputMessage, selectedLanguage);

    setChatHistory(prev => [...prev, { sender: "bot", text: data.message?.content || "" }]);
    setInputMessage("");
  };

  const handleReset = async () => {
    await resetContext();
    setChatHistory([]);
  };

  return (
    <div
      style={{
        width: 400,
        margin: "0 auto",
        padding: 20,
        background: "#1e1e2f",
        color: "white",
        borderRadius: 10,
      }}
    >
      {/* Language selector and reset */}
      <div style={{ marginBottom: 10 }}>
        <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
          <option value="spanish">Spanish</option>
          <option value="french">French</option>
        </select>
        <button onClick={handleReset} style={{ marginLeft: 10 }}>
          Reset Context
        </button>
      </div>

      {/* Chat history */}
      <div
        style={{
          minHeight: 200,
          border: "1px solid #444",
          padding: 10,
          marginBottom: 10,
          overflowY: "auto",
        }}
      >
        {chatHistory.map((c, i) => (
          <div key={i} style={{ textAlign: c.sender === "user" ? "right" : "left" }}>
            <b>{c.sender}:</b> {c.text}
          </div>
        ))}
      </div>

      {/* Input using your Input component */}
      <Input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder="Type your message..."
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
      />

      <button
        onClick={handleSend}
        style={{ width: "100%", marginTop: 5, padding: 8, borderRadius: 5, background: "#6a11cb", color: "white" }}
      >
        Send
      </button>
    </div>
  );
}
