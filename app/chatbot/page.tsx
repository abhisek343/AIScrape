"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Will restyle later
import { Send, Loader2, Trash2, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// New component to handle message content and render Mermaid diagrams
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
            <div key={mermaidId} className="mermaid p-4 my-2 bg-gray-800 rounded overflow-auto" data-mermaid-id={mermaidId}>
              {mermaidCode}
            </div>
          );
        } else {
          return <span key={index} style={{ whiteSpace: 'pre-wrap'}}>{part}</span>;
        }
      })}
    </>
  );
};


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral", 
      // For ChatGPT like, consider 'dark' or a custom theme if a dark mode is active
      // themeVariables: {
      //   darkMode: true, // if your app has a dark mode toggle
      //   background: '#343541', // Example ChatGPT dark background
      //   primaryColor: '#4A4A4A', // Example
      //   primaryTextColor: '#FFFFFF',
      //   lineColor: '#7A7A7A',
      //   // ... more theme variables
      // }
    });
  }, []);

  const runMermaid = useCallback(() => {
    setTimeout(() => {
      try {
        const mermaidElements = document.querySelectorAll(".mermaid");
        if (mermaidElements.length > 0) {
          // @ts-ignore
          mermaid.run({ nodes: mermaidElements });
        }
      } catch (error) {
        console.error("Error running mermaid:", error);
      }
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
    if (messages.some(msg => msg.content.includes("```mermaid"))) {
      runMermaid();
    }
  }, [messages, runMermaid]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = { role: "user", content: input };
    const currentInput = input;
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput(""); 
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "Error: Could not connect. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { // Changed to HTMLTextAreaElement
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline on Enter
      handleSendMessage();
    }
  };

  const handleClearHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chatbot/delete-history", { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Server error." }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      setMessages([]);
      toast({ title: "Success", description: "Chat history cleared." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not clear history.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-white"> {/* ChatGPT-like dark background */}
      {/* Header (Optional, can be simple) */}
      <header className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-semibold">AI Assistant</h1>
        <Button variant="outline" size="sm" onClick={handleClearHistory} disabled={isLoading} className="text-gray-300 border-gray-600 hover:bg-gray-700">
          <Trash2 className="w-4 h-4 mr-2" /> Clear History
        </Button>
      </header>

      {/* Chat Messages Area */}
      <ScrollArea className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400">
            Ask anything about creating workflows...
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={cn(
              "p-4 rounded-lg max-w-[85%] flex flex-col",
              msg.role === "user"
                ? "bg-blue-600 text-white self-end items-end" // User messages
                : "bg-gray-700 text-gray-100 self-start items-start" // Assistant messages
            )}
          >
            <ChatMessageContent content={msg.content} />
          </div>
        ))}
        {isLoading && messages[messages.length -1]?.role === 'user' && ( // Show thinking only after user message
          <div className="self-start p-4 bg-gray-700 rounded-lg flex items-center text-gray-400">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            AI is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="relative flex items-center">
          <textarea // Changed Input to textarea for multi-line
            placeholder={isLoading ? "AI is thinking..." : "Ask how to build a workflow..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 p-3 pr-16 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            rows={1} // Start with 1 row, can expand
            disabled={isLoading}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage} 
            disabled={isLoading || input.trim() === ""}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-md p-2"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
         <p className="text-xs text-gray-500 mt-2 text-center">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
