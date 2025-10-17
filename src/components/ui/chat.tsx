import { useState } from "react";
import { sendMessage, uploadDocument } from "../../api/backend"; // ✅ removed resetContext (not used in backend)
import { Input } from "./input"; // ✅ path corrected

export default function Chat() {
  const [inputMessage, setInputMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ sender: string; text: string }[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("english");

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    setChatHistory((prev) => [...prev, { sender: "user", text: inputMessage }]);

    try {
      // Send to backend
      const data = await sendMessage(inputMessage);

      // Add bot response
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: data.answer || "No response from backend" },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Failed to connect to backend." },
      ]);
    }

    setInputMessage("");
  };

  const handleReset = () => {
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
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{ padding: 5 }}
        >
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
          <option value="spanish">Spanish</option>
          <option value="french">French</option>
        </select>
        <button
          onClick={handleReset}
          style={{
            marginLeft: 10,
            padding: "5px 10px",
            background: "#444",
            color: "white",
            borderRadius: 5,
            border: "none",
            cursor: "pointer",
          }}
        >
          Reset Chat
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
        style={{
          width: "100%",
          marginTop: 5,
          padding: 8,
          borderRadius: 5,
          background: "#6a11cb",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Send
      </button>
    </div>
  );
}
