"use client";

import React, { useState, useRef, useEffect, useCallback } from "react"; // Added useCallback
import { useRouter } from "next/navigation";
import mermaid from "mermaid"; // Added mermaid import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed RadioGroup, RadioGroupItem, Label imports
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareText, Send, Loader2, Trash2 } from "lucide-react"; // Added Trash2
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast"; // Added useToast

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatbotWidgetProps {
  workflowId?: string; // Optional workflowId prop
}

export function ChatbotWidget({ workflowId }: ChatbotWidgetProps) { // Destructure workflowId
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  // const [chatMode, setChatMode] = useState<ChatMode>("Plan"); // Removed chatMode state
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark", // Using dark theme for Mermaid to fit code block style
      darkMode: true, // Assuming a dark theme preference for diagrams
      // themeVariables: { // Example for more granular control if needed
      //   background: '#2D2D2D', // Darker background for diagrams
      //   primaryColor: '#BBBBBB', // Lighter color for diagram elements
      //   primaryTextColor: '#FFFFFF',
      //   lineColor: '#A0A0A0',
      // }
    });
  }, []);

  const runMermaid = useCallback(() => {
    // Delay slightly to ensure DOM is updated
    setTimeout(() => {
      try {
        // Use querySelector API per Mermaid v10+ recommended usage
        // @ts-ignore
        mermaid.run({ querySelector: '.mermaid' });
      } catch (error) {
        console.error("Error running mermaid:", error);
      }
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
    runMermaid(); // Run mermaid when messages change
  }, [messages, runMermaid]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = { role: "user", content: input };
    const currentInput = input; // Store current input before clearing
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Simple slash command passthrough: create+run, then refresh editor
      if (currentInput.trim().startsWith('/')) {
        const res = await fetch('/api/workflows/slash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: currentInput, workflowId }),
        });
        const data = await res.json();
        if (data?.ok) {
          setMessages((prev) => [...prev, { role: 'assistant', content: `Workflow created and started. Workflow ID: ${data.workflowId}. Execution ID: ${data.executionId}.` }]);
          router.refresh();
          return;
        }
        // Fallthrough to chatbot if unsupported slash
      }

      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: currentInput, workflowId }), // Pass workflowId
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Chatbot API Error Body:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const assistantResponseContent = data.response;
      setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: assistantResponseContent }]);

      // Check if the response indicates a workflow was created by AI
      // This relies on the AI's output text pattern from the prompt.
      if (
        assistantResponseContent.toLowerCase().includes("workflow") &&
        assistantResponseContent.toLowerCase().includes("created") &&
        assistantResponseContent.toLowerCase().includes("id:")
      ) {
        router.refresh(); // Refresh server components and refetch initial data for client components
      }
    } catch (error) {
      console.error("Failed to send message to chatbot API:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "Error: Could not connect to the AI assistant." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleClearHistory = async () => {
    setIsLoading(true);
    try {
      // Pass workflowId to delete history for a specific workflow context if needed by backend
      const deleteUrl = workflowId
        ? `/api/chatbot/delete-history?workflowId=${workflowId}`
        : "/api/chatbot/delete-history";
      // Note: For DELETE, query params are common. If body is preferred, adjust backend.
      // For now, assuming backend will be adapted for query param or general user history if no ID.

      const response = await fetch(deleteUrl, { // Use dynamic URL
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to clear history. Server error." }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setMessages([]); // Clear messages from UI
      toast({
        title: "Success",
        description: "Chat history cleared.",
      });
    } catch (error: any) {
      console.error("Failed to clear chat history:", error);
      toast({
        title: "Error",
        description: error.message || "Could not clear chat history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        className="rounded-full w-14 h-14 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageSquareText className="w-6 h-6" />
      </Button>

      {isOpen && (
        <Card className="w-96 h-[500px] flex flex-col shadow-xl absolute bottom-16 right-0"> {/* Increased width and height */}
          <CardHeader className="p-4 border-b">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={handleClearHistory} disabled={isLoading} title="Clear chat history">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  X
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="flex flex-col space-y-2">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground">
                    Type a message to start the conversation.
                  </div>
                )}
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg max-w-[85%] shadow-sm",
                      msg.role === "user"
                        ? "bg-green-600 text-white self-end" // User message with project theme color
                        : "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 self-start" // Assistant message
                    )}
                  >
                    <ChatMessageContent content={msg.content} />
                  </div>
                ))}
                {isLoading && (
                  <div className="self-start p-3 bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 rounded-lg flex items-center shadow-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Thinking...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 border-t flex items-center">
            <Input
              placeholder={isLoading ? "AI is thinking..." : "Type your message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 mr-2"
              disabled={isLoading}
            />
            <Button size="icon" onClick={handleSendMessage} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
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
          // Generate a unique ID for each mermaid diagram to prevent conflicts
          const mermaidId = `mermaid-${Date.now()}-${index}`;
          return (
            // Styling for Mermaid block container
            <div
              key={mermaidId}
              className="mermaid my-2 p-3 bg-gray-900 rounded-md overflow-auto" // Dark background for code/diagram
              data-mermaid-id={mermaidId}
            >
              {mermaidCode}
            </div>
          );
        } else {
          // Render non-Mermaid parts with whitespace-pre-wrap
          return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
        }
      })}
    </>
  );
};
