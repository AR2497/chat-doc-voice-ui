import { useState, useRef, useEffect } from "react";
import { Upload, MessageSquare, Mic, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

export const BASE_URL = "http://127.0.0.1:8000"; // FastAPI backend

interface Message {
  role: "user" | "assistant";
  content: string;
  fullContent?: string;
  isStreaming?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

const Index = () => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("chatSessions");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      timestamp: new Date(),
      messages: [],
    };
    setChatSessions(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setMessages([]);
    setFirstMessageSent(false);
    setEditingIndex(null);
  };

  const handleUpload = () => fileInputRef.current?.click();

  const stopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setMessages(prev =>
        prev.map(msg =>
          msg.role === "assistant" && msg.isStreaming
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
    }
  };

  const handleChat = async (editedText?: string) => {
    if ((!inputValue.trim() && !editedText?.trim())) return;
    if (isLoading) return stopResponse();

    const messageContent = editedText || inputValue;
    setFirstMessageSent(true);

    const userMessage: Message = { role: "user", content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setEditingIndex(null);

    if (activeChatId) {
      setChatSessions(prev =>
        prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, userMessage] }
            : chat
        )
      );
    }

    let assistantMessage: Message = { role: "assistant", content: "", fullContent: "", isStreaming: true };
    setMessages(prev => [...prev, assistantMessage]);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", messageContent);

      const response = await fetch(`${BASE_URL}/chat/stream`, {
        method: "POST",
        body: formData,
        signal,
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            const chunk = json.message?.content;
            if (chunk) {
              assistantMessage = {
                ...assistantMessage,
                fullContent: (assistantMessage.fullContent || "") + chunk,
                content: (assistantMessage.fullContent || "") + chunk,
                isStreaming: true,
              };
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = assistantMessage;
                return updated;
              });
            }
          } catch {}
        }
      }

      assistantMessage.isStreaming = false;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...assistantMessage };
        return updated;
      });

      if (activeChatId) {
        setChatSessions(prev =>
          prev.map(chat =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  messages: [...chat.messages.filter(m => m.role !== "assistant"), assistantMessage],
                }
              : chat
          )
        );
      }
    } catch (err: any) {
      if (signal.aborted) {
        toast({ title: "Stopped", description: "Response stopped by user" });
      } else {
        toast({ title: "Error", description: "Failed to connect to backend", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (index: number) => setEditingIndex(index);
  const saveEdit = (index: number, value: string) => {
    const updated = [...messages];
    updated[index].content = value;
    setMessages(updated);
    if (activeChatId) {
      setChatSessions(prev =>
        prev.map(chat =>
          chat.id === activeChatId ? { ...chat, messages: updated } : chat
        )
      );
    }
    setEditingIndex(null);
    handleChat(value);
  };

  const handleVoice = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast({ title: "Error", description: "Voice not supported in this browser" });
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join("");
      setInputValue(transcript);

      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = setTimeout(() => {
        if (transcript.trim()) {
          handleChat(transcript);
          recognition.stop();
          recognitionRef.current = null;
          setIsListening(false);
        }
      }, 2000);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  };

  const renderAssistantMessage = (message: Message) => {
    return (
      <p className="whitespace-pre-wrap break-words">
        {message.content}
        {message.isStreaming && <span className="animate-pulse">...</span>}
      </p>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      {firstMessageSent && (
        <div className="w-64 border-r border-border bg-muted flex flex-col h-screen">
          <div className="p-4">
            <Button className="w-full" onClick={createNewChat}>New Chat</Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 p-2">
            {chatSessions.map(chat => (
              <div key={chat.id} className={`rounded-lg p-3 hover:bg-background/50 ${activeChatId === chat.id ? "bg-background" : ""}`}>
                <button className="flex-1 text-left truncate" onClick={() => setActiveChatId(chat.id)}>
                  <div className="truncate text-sm">{chat.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(chat.timestamp).toLocaleDateString()}</div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center px-4">
            <img src={logo} alt="QuantumBot" className="h-10 w-10" />
            <span className="ml-3 text-xl font-bold text-foreground">QuantumBot</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-6 p-4">
            {/* Centered Ask Anything */}
            {messages.length === 0 && !firstMessageSent && (
              <div className="flex h-[70vh] flex-col items-center justify-center gap-6">
                <h1 className="text-3xl font-bold text-foreground text-center">What's on your mind today?</h1>
                <div className="w-full max-w-lg flex items-center gap-2 rounded-full border border-gray-300 p-3 shadow-sm">
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full" onClick={handleUpload}><Upload className="h-6 w-6" /></Button>
                  <textarea
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                    placeholder="Ask anything..."
                    className="flex-1 resize-none overflow-hidden bg-white border-0 focus:ring-0 focus:outline-none text-foreground p-3 rounded-full max-h-40"
                    rows={1}
                  />
                  <Button variant="ghost" size="icon" className={`h-12 w-12 rounded-full ${isListening ? "bg-red-200 animate-pulse" : ""}`} onClick={handleVoice}><Mic className="h-6 w-6" /></Button>
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full" onClick={handleChat}><MessageSquare className="h-6 w-6" /></Button>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => (
              <div key={index} className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user" ? "bg-gray-200 text-foreground" : "bg-white text-foreground"}`}>
                  {message.role === "assistant" ? renderAssistantMessage(message) :
                    editingIndex === index ? (
                      <textarea
                        value={message.content}
                        onChange={e => {
                          const updated = [...messages];
                          updated[index].content = e.target.value;
                          setMessages(updated);
                        }}
                        rows={1}
                        className="w-full resize-none border-0 bg-gray-200 text-foreground p-1 rounded-md"
                      />
                    ) : <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  }
                </div>
                {message.role === "user" && (
                  <div className="flex gap-2 mt-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={() => handleEdit(index)}><Edit2 className="h-4 w-4" /></Button>
                    {editingIndex === index && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={() => saveEdit(index, message.content)}><MessageSquare className="h-4 w-4" /></Button>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Ask Anything */}
        {messages.length > 0 && firstMessageSent && (
          <div className="border-t border-border bg-background p-4">
            <div className="mx-auto max-w-3xl flex items-center gap-2 rounded-full border border-gray-300 p-2 shadow-sm">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full" onClick={handleUpload}><Upload className="h-6 w-6" /></Button>
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                placeholder="Ask anything..."
                className="flex-1 resize-none overflow-hidden bg-white border-0 focus:ring-0 focus:outline-none text-foreground p-3 rounded-full max-h-40"
                rows={1}
              />
              <Button variant="ghost" size="icon" className={`h-12 w-12 rounded-full ${isListening ? "bg-red-200 animate-pulse" : ""}`} onClick={handleVoice}><Mic className="h-6 w-6" /></Button>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full" onClick={isLoading ? stopResponse : () => handleChat()}><MessageSquare className="h-6 w-6" /></Button>
            </div>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.pdf,.doc,.docx" />
    </div>
  );
};

export default Index;
