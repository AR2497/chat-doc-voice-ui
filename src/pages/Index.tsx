import { useState, useRef, useEffect } from "react";
import { Upload, MessageSquare, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png"; // ✅
 // if Index.tsx is in src/pages
 // updated logo

const BASE_URL = "http://127.0.0.1:5000";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${BASE_URL}/upload`, { method: "POST", body: formData });
      if (response.ok) {
        toast({ title: "Success", description: "Document uploaded successfully" });
      } else {
        toast({ title: "Error", description: "Failed to upload document", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to backend", variant: "destructive" });
    }
  };

  const handleChat = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", inputValue);

      const response = await fetch(`${BASE_URL}/chat/stream`, { method: "POST", body: formData });
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let assistantMessage: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMessage]);

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
              assistantMessage.content += chunk;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...assistantMessage };
                return newMessages;
              });
            }
          } catch {
            // ignore incomplete JSON lines
          }
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to backend", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoice = () => {
    toast({ title: "Voice Feature", description: "Voice input functionality coming soon" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center px-4">
          <img src={logo} alt="QuantumBot" className="h-10 w-10" />
          <span className="ml-3 text-xl font-bold text-foreground">QuantumBot</span>
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".txt,.pdf,.doc,.docx"
      />

      {/* Chat Area */}
      <div className="flex flex-1 flex-col pt-16">
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 ? (
              <div className="flex h-[70vh] flex-col items-center justify-center gap-6">
                {/* Welcome Message Only */}
                <h1 className="text-3xl font-bold text-foreground text-center">
                  Hey! QuantumBot welcomes you
                </h1>

                {/* Ask Anything Input */}
                <div className="w-full max-w-md">
                  <div className="relative flex items-center gap-2 rounded-full border border-input bg-card p-2 shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-full"
                      onClick={handleUpload}
                    >
                      <Upload className="h-5 w-5" />
                    </Button>

                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChat()}
                      placeholder="Ask anything"
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      disabled={isLoading}
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-full"
                      onClick={handleChat}
                      disabled={isLoading}
                    >
                      <MessageSquare className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-full"
                      onClick={handleVoice}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area (fixed at bottom for ongoing chat) */}
        {messages.length > 0 && (
          <div className="border-t border-border bg-background px-4 py-4">
            <div className="mx-auto max-w-3xl">
              <div className="relative flex items-center gap-2 rounded-full border border-input bg-card p-2 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full"
                  onClick={handleUpload}
                >
                  <Upload className="h-5 w-5" />
                </Button>

                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChat()}
                  placeholder="Ask anything"
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={isLoading}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full"
                  onClick={handleChat}
                  disabled={isLoading}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full"
                  onClick={handleVoice}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
