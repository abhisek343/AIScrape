"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import mermaid from "mermaid";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquareText,
  Send,
  Loader2,
  Trash2,
  X,
  Sparkles,
  HelpCircle,
  Zap,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatbotWidgetProps {
  workflowId?: string;
}

const QUICK_ACTIONS = [
  { label: "Help with this flow", icon: HelpCircle, text: "Can you explain what my current workflow does?" },
  { label: "Optimize layout", icon: Zap, text: "How can I improve the layout of these nodes?" },
  { label: "Suggestion", icon: Sparkles, text: "What node should I add next to handle data storage?" },
  { label: "AI Automate", icon: Wand2, text: "automation on: create a workflow to scrape news from " },
];

export function ChatbotWidget({ workflowId }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      darkMode: true,
    });
  }, []);

  const runMermaid = useCallback(() => {
    setTimeout(() => {
      try {
        // @ts-ignore
        mermaid.run({ querySelector: '.mermaid' });
      } catch (error) {
        console.error("Error running mermaid:", error);
      }
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
    runMermaid();
  }, [messages, runMermaid]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (text.trim() === "") return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      if (text.trim().startsWith('/')) {
        const res = await fetch('/api/workflows/slash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: text, workflowId }),
        });
        const data = await res.json();
        if (data?.ok) {
          setMessages((prev) => [...prev, { role: 'assistant', content: `Workflow created and started. Workflow ID: ${data.workflowId}. Execution ID: ${data.executionId}.` }]);
          router.refresh();
          return;
        }
      }

      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, workflowId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: data.response }]);

      if (
        data.response.toLowerCase().includes("workflow") &&
        data.response.toLowerCase().includes("created")
      ) {
        router.refresh();
      }
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "I encountered an error. Please check your connection or try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendMessage();
  };

  const handleClearHistory = async () => {
    setIsLoading(true);
    try {
      const deleteUrl = workflowId
        ? `/api/chatbot/delete-history?workflowId=${workflowId}`
        : "/api/chatbot/delete-history";

      const response = await fetch(deleteUrl, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to clear history");

      setMessages([]);
      toast({ title: "History Cleared", description: "Your conversation has been reset." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="z-[100] flex flex-col items-start"
      style={{ position: 'fixed', bottom: '1.5rem', left: '1.5rem', right: 'auto', top: 'auto' }}
    >
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, x: -20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0, x: -20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              className="rounded-full w-16 h-16 shadow-[0_0_20px_rgba(37,99,235,0.4)] bg-blue-600 hover:bg-blue-500 text-white border-0 transition-all duration-300"
              onClick={() => setIsOpen(true)}
            >
              <MessageSquareText className="w-7 h-7" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 top-4 md:absolute md:inset-auto md:bottom-20 md:left-0 w-auto h-auto md:w-[420px] md:h-[600px] z-[101]"
          >
            <Card className="w-full h-full flex flex-col border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-background/95 backdrop-blur-2xl overflow-hidden rounded-2xl md:rounded-3xl">
              <CardHeader className="p-4 border-b border-white/5 bg-gradient-to-r from-emerald-500/10 to-transparent">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <CardTitle className="text-lg font-semibold tracking-tight">AI Scrape Assistant</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClearHistory}
                      disabled={isLoading}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Clear chat history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 text-muted-foreground hover:bg-white/10 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full px-4 pt-4">
                  <div className="flex flex-col space-y-4 pb-4">
                    {messages.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-[400px] text-center space-y-4"
                      >
                        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-2">
                          <Sparkles className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">Hello! I'm your AI guide.</h3>
                          <p className="text-sm text-muted-foreground max-w-[250px]">
                            Ask me to create a workflow, explain nodes, or optimize your scraping flow.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 w-full pt-4">
                          {QUICK_ACTIONS.map((action, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.02, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleSendMessage(action.text)}
                              className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 text-left text-sm transition-all text-muted-foreground hover:text-foreground"
                            >
                              <action.icon className="w-4 h-4 text-emerald-500" />
                              {action.label}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20, y: 10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        className={cn(
                          "flex flex-col max-w-[85%] relative",
                          msg.role === "user" ? "self-end" : "self-start"
                        )}
                      >
                        <div
                          className={cn(
                            "p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed",
                            msg.role === "user"
                              ? "bg-emerald-600 text-white rounded-tr-none"
                              : "bg-muted text-foreground rounded-tl-none border border-white/5 backdrop-blur-md"
                          )}
                        >
                          <ChatMessageContent content={msg.content} />
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                          {msg.role === "user" ? "You" : "Assistant"}
                        </span>
                      </motion.div>
                    ))}

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="self-start p-3 bg-muted border border-white/5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2"
                      >
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                        <span className="text-xs font-medium text-muted-foreground">AI is working...</span>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="p-4 border-t border-white/5 bg-muted/30 backdrop-blur-md">
                <div className="flex w-full items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder={isLoading ? "Please wait..." : "Message AI Scrape..."}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full bg-background/50 border-white/10 rounded-xl pr-10 h-10 ring-offset-emerald-500 focus-visible:ring-emerald-500/50"
                      disabled={isLoading}
                    />
                    <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/40 pointer-events-none" />
                  </div>
                  <Button
                    size="icon"
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="rounded-xl h-10 w-10 bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ChatMessageContent: React.FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/(\`\`\`mermaid[\s\S]*?\`\`\`)/g);

  return (
    <>
      {parts.map((part, index) => {
        const mermaidMatch = part.match(/\`\`\`mermaid([\s\S]*?)\`\`\`/);
        if (mermaidMatch && mermaidMatch[1]) {
          const mermaidCode = mermaidMatch[1].trim();
          const mermaidId = `mermaid-${Date.now()}-${index}`;
          return (
            <div key={mermaidId} className="my-3 rounded-xl overflow-hidden border border-white/10 bg-black/40">
              <div className="px-3 py-1.5 border-b border-white/5 bg-white/5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Workflow Diagram
              </div>
              <div className="mermaid p-4 overflow-auto" data-mermaid-id={mermaidId}>
                {mermaidCode}
              </div>
            </div>
          );
        }
        return <span key={index} className="whitespace-pre-wrap">{part}</span>;
      })}
    </>
  );
};
