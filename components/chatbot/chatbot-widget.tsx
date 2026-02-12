"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import mermaid from "mermaid";
import { ReactFlowProvider } from '@xyflow/react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquareText,
  Send,
  Loader2,
  Trash2,
  X,
  Sparkles,
  HelpCircle,
  Zap,
  Wand2,
  Bot,
  Command,
  Maximize2,
  Minimize2,
  MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatbotWidgetProps {
  workflowId?: string;
  getFlowState?: () => { nodes: any[]; edges: any[]; viewport: any };
  onAutoLayout?: () => void;
}

const QUICK_ACTIONS = [
  { label: "Explain Flow", icon: HelpCircle, text: "/explain" },
  { label: "Optimize", icon: Zap, text: "/optimize" },
  { label: "New Node", icon: Sparkles, text: "Add a node to " },
];

export function ChatbotWidget({ workflowId, getFlowState, onAutoLayout }: ChatbotWidgetProps) {
  // If we have getFlowState, we assume we are in the editor and have a parent Provider.
  // If not, we wrap ourselves to avoid crashes.
  const shouldWrap = !getFlowState;

  if (shouldWrap) {
    return (
      <ReactFlowProvider>
        <ChatbotInterface workflowId={workflowId} />
      </ReactFlowProvider>
    );
  }

  return <ChatbotInterface workflowId={workflowId} getFlowState={getFlowState} onAutoLayout={onAutoLayout} />;
}

function ChatbotInterface({ workflowId, getFlowState, onAutoLayout }: ChatbotWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Note: We intentionally don't use useReactFlow() here because:
  // 1. The component may be rendered outside of a valid ReactFlow context
  // 2. All flow functionality is provided via getFlowState and onAutoLayout props

  useEffect(() => {
    if (mermaid) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        darkMode: true,
        fontFamily: "Inter, sans-serif"
      });
    }
  }, []);

  const runMermaid = useCallback(() => {
    if (!mermaid) return () => {};
    const timeoutId = setTimeout(() => {
      try {
        // @ts-ignore
        mermaid.run({ querySelector: '.mermaid' });
      } catch (error) {
        console.error("Error running mermaid:", error);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    scrollToBottom();
    const cleanup = runMermaid();
    return cleanup;
  }, [messages, runMermaid, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (text.trim() === "") return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    if (!textToSend) {
      setInput("");
      setShowSlashMenu(false);
    }

    setIsLoading(true);

    try {
      // Handle Slash Commands Client-Side if needed
      if (text.trim() === "/optimize" && onAutoLayout) {
        onAutoLayout();
        setMessages(prev => [...prev, { role: "assistant", content: "I've optimized the layout for you! anything else?" }]);
        setIsLoading(false);
        return;
      }

      // Prepare context if available
      let contextData = {};
      if (getFlowState) {
        const state = getFlowState();
        if (state) {
          contextData = {
            nodeCount: state.nodes.length,
            edgeCount: state.edges.length,
            selectedNodes: state.nodes.filter((n: any) => n.selected).map((n: any) => n.id)
          };
        }
      }

      const payload = {
        message: text,
        workflowId,
        context: contextData // Send context to API
      };

      if (text.trim().startsWith('/')) {
        const res = await fetch('/api/workflows/slash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: text, workflowId, ...contextData }),
        });
        const data = await res.json();
        if (data?.ok) {
          // ... handle response
          setMessages((prev) => [...prev, { role: 'assistant', content: data.message || `Command executed.` }]);
          if (data.workflowId) router.refresh();
          return;
        }
      }

      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: data.response }]);

      if (data.response.toLowerCase().includes("workflow") && data.response.toLowerCase().includes("created")) {
        router.refresh();
      }

    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendMessage();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setShowSlashMenu(val === "/");
  };

  const handleClearHistory = async () => {
    setIsLoading(true);
    try {
      const deleteUrl = workflowId ? `/api/chatbot/delete-history?workflowId=${workflowId}` : "/api/chatbot/delete-history";
      await fetch(deleteUrl, { method: "DELETE" });
      setMessages([]);
      toast({ title: "History Cleared" });
      setIsOpen(false);
      setTimeout(() => setIsOpen(true), 100); // Visual reset
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  console.log("DEBUG: ChatbotWidget Rendered");

  // Don't render anything until mounted to prevent hydration mismatch with AnimatePresence
  if (!mounted) return null;

  return (
    <div className="z-[100] fixed bottom-6 left-[340px] flex flex-col items-start gap-4">
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 20 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] backdrop-blur-md transition-all hover:shadow-[0_0_50px_rgba(16,185,129,0.6)]"
          >
            <Bot className="h-7 w-7 transition-transform group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className={cn(
              "fixed inset-x-4 bottom-4 md:absolute md:inset-auto md:bottom-20 md:left-0 z-[101]",
              "w-auto md:w-[450px]",
              isExpanded ? "h-[85vh] md:h-[800px]" : "h-[60vh] md:h-[650px]"
            )}
          >
            {/* Glass Container */}
            <div className="relative flex flex-col h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 bg-white/5 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/20 shadow-inner">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-100">AI Assistant</h3>
                    <p className="text-xs text-emerald-400/60 font-medium">Online • {workflowId ? 'Connected to Flow' : 'Ready'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 rounded-xl">
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 rounded-xl">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6 pb-4">
                  {messages.length === 0 && (
                    <div className="mt-8 flex flex-col items-center gap-4 text-center">
                      <div className="h-24 w-24 rounded-full bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                        <Bot className="h-10 w-10 text-emerald-500/50" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-medium text-white">How can I help?</h4>
                        <p className="text-sm text-white/40 max-w-[260px]">I can explain nodes, optimize layouts, or create new workflows for you.</p>
                      </div>
                      <div className="grid grid-cols-1 w-full gap-2 mt-4 px-4">
                        {QUICK_ACTIONS.map((action, i) => (
                          <button key={i} onClick={() => handleSendMessage(action.text)}
                            className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all text-sm group text-left">
                            <div className="p-2 rounded-lg bg-black/20 group-hover:bg-emerald-500/20 text-emerald-500">
                              <action.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-white/80 group-hover:text-emerald-400">{action.label}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                      <div className={cn("h-8 w-8 rounded-full flex flex-shrink-0 items-center justify-center border overflow-hidden",
                        msg.role === "user" ? "bg-white/10 border-white/10" : "bg-emerald-500/10 border-emerald-500/20")}>
                        {msg.role === "user" ? <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-500" /> : <Bot className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <div className={cn("flex flex-col gap-1 max-w-[85%]")}>
                        <div className={cn("p-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                          msg.role === "user" ? "bg-white text-black rounded-tr-none font-medium" : "bg-white/5 border border-white/10 text-emerald-50 rounded-tl-none")}>
                          <ChatMessageContent content={msg.content} />
                        </div>
                        <span className="text-[10px] text-white/30 px-2">{msg.role === "user" ? "You" : "Assistant"}</span>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="p-4 rounded-3xl rounded-tl-none bg-white/5 border border-white/10 flex items-center gap-2">
                        <div className="flex gap-1 h-3 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-xs text-emerald-500/80 font-medium">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Slash Menu */}
              <AnimatePresence>
                {showSlashMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-[80px] left-4 right-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 z-10 shadow-2xl overflow-hidden"
                  >
                    <div className="text-[10px] uppercase font-bold text-white/30 px-3 py-2">Commands</div>
                    {QUICK_ACTIONS.map((action, i) => (
                      <button key={i} onClick={() => handleSendMessage(action.text)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-emerald-500/20 text-sm text-left transition-colors group">
                        <div className="h-7 w-7 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/30">
                          <Command className="h-3 w-3 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-emerald-100 font-medium">{action.text}</div>
                          <div className="text-white/40 text-xs">{action.label}</div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Area */}
              <div className="p-4 bg-white/5 border-t border-white/5 backdrop-blur-md">
                <div className="relative flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl px-2 py-1 shadow-inner focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type '/' for commands..."
                    className="border-0 bg-transparent focus-visible:ring-0 text-sm text-white placeholder:text-white/30 h-10"
                    disabled={isLoading}
                  />
                  <Button size="icon" onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading} className="h-8 w-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center px-2 mt-2">
                  <span className="text-[10px] text-white/20">Press <kbd className="font-sans">↵</kbd> to send</span>
                  <button onClick={handleClearHistory} className="text-[10px] text-white/20 hover:text-red-400 transition-colors flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Clear History
                  </button>
                </div>
              </div>

            </div>
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
            <div key={mermaidId} className="my-3 rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-lg">
              <div className="px-3 py-2 border-b border-white/5 bg-white/5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Wand2 className="h-3 w-3" />
                Generated Workflow
              </div>
              <div className="mermaid p-4 overflow-auto bg-[#0a0a0a]" data-mermaid-id={mermaidId}>
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

