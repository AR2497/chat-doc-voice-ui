import { useState } from "react";
import { Upload, MessageSquare, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/quantumbot-logo.png";

const Index = () => {
  const [inputValue, setInputValue] = useState("");
  const { toast } = useToast();

  const handleUpload = () => {
    toast({
      title: "Upload document",
      description: "Document upload functionality",
    });
  };

  const handleChat = () => {
    if (!inputValue.trim()) return;
    toast({
      title: "Chat",
      description: `Message: ${inputValue}`,
    });
    setInputValue("");
  };

  const handleVoice = () => {
    toast({
      title: "Voice",
      description: "Voice input functionality",
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

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center px-4 pt-16">
        <div className="w-full max-w-3xl space-y-8">
          <div className="text-center">
            <h1 className="mb-2 text-4xl font-bold text-foreground">
              Ready when you are.
            </h1>
          </div>

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
              onKeyDown={(e) => e.key === "Enter" && handleChat()}
              placeholder="Ask anything"
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full"
              onClick={handleChat}
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
  );
};

export default Index;
