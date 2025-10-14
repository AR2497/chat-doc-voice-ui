import { useState, useRef } from "react";
import { Upload, MessageSquare, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/quantumbot-logo.png";

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

  const handleUpload = async () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Document uploaded successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to upload document",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to backend",
        variant: "destructive",
      });
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
      formData.append("target_lang", "english");

      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response || data.message || "No response",
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        toast({
          title: "Error",
          description: "Failed to get response",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to backend",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoice = () => {
    toast({
      title: "Voice",
      description: "Voice input functionality coming soon",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header with Logo */}
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

      {/* Main Content */}
      <div className="flex flex-1 flex-col pt-16">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h1 className="mb-2 text-4xl font-bold text-foreground">
                    Ready when you are.
                  </h1>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
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

        {/* Input Area */}
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
      </div>
    </div>
  );
};

export default Index;
