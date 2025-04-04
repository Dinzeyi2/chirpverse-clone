
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ImageIcon, PlusCircle, Plus, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { Canvas } from '@/components/palm/Canvas';
import { supabase } from "@/integrations/supabase/client";
import CodeBlock from '@/components/code/CodeBlock';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Define a proper type for chat messages
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// Function to parse markdown code blocks from text
const parseCodeBlocks = (text: string) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: Array<{ type: 'text' | 'code', content: string, language?: string }> = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    
    // Add the code block
    parts.push({
      type: 'code',
      content: match[2], // The code content
      language: match[1] || 'javascript' // The language or default to javascript
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text after the last code block
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }
  
  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
};

const Palm = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Add user message to chat with explicit typing
    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    
    try {
      // Call the Gemini API via Supabase Edge Function
      console.log("Calling gemini-chat with messages:", JSON.stringify(updatedMessages));
      
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { messages: updatedMessages },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Failed to communicate with chat service");
      }
      
      if (!data || !data.message) {
        console.error("Invalid response from gemini-chat:", data);
        throw new Error("Invalid response from chat service");
      }
      
      console.log("Received response from gemini-chat:", data);
      // Add assistant message with explicit typing
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.message };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCanvas = () => {
    setShowCanvas(!showCanvas);
    setIsSheetOpen(true);
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowCanvas(false);
  };

  // Render message content with code blocks
  const renderMessageContent = (content: string) => {
    const parts = parseCodeBlocks(content);
    
    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={index} className="my-2 w-full">
            <CodeBlock 
              code={part.content} 
              language={part.language || 'javascript'}
              expanded={true}
              inPost={true} 
            />
          </div>
        );
      } else {
        // Use whitespace-pre-wrap to preserve whitespace in text
        return (
          <div key={index} className="whitespace-pre-wrap break-words">
            {part.content}
          </div>
        );
      }
    });
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen max-h-[calc(100vh-64px)] pt-4 bg-[#f9f9f9] dark:bg-[#0c0c0c]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4">
          <h1 className="text-2xl font-semibold">Palm</h1>
          <Button variant="outline" size="sm" onClick={handleNewChat}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Messages Container */}
        <div className="flex-grow overflow-y-auto px-4 pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="text-3xl font-bold mb-4">What can I help with?</h2>
              <p className="text-muted-foreground">Ask anything, including code questions...</p>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-full md:max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-[#2196f3] text-white rounded-2xl' 
                        : 'bg-[#f5f5f1] text-[#1f1f1f] dark:bg-[#1a1a1a] dark:text-[#f1f1f1] rounded-2xl'
                    }`}
                  >
                    {renderMessageContent(message.content)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2 bg-[#f5f5f1] text-[#1f1f1f] dark:bg-[#1a1a1a] dark:text-[#f1f1f1] rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Canvas Sheet (Side Panel) */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-[90%] sm:w-[600px] p-0" side="right">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Whiteboard</h2>
                <p className="text-sm text-muted-foreground">Draw or diagram your ideas</p>
              </div>
              <div className="flex-grow overflow-auto p-4">
                <Canvas />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-background">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 rounded-full flex-shrink-0"
                      onClick={toggleCanvas}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open canvas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center w-full rounded-[24px] border border-border bg-background shadow-sm">
              <div className="flex-grow px-2">
                <form onSubmit={handleSubmit} className="flex items-center w-full">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything"
                    className="w-full py-3 px-3 bg-transparent border-none focus:outline-none text-sm"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    variant="ghost"
                    className="ml-1 rounded-full h-8 w-8" 
                    disabled={!input.trim() || isLoading}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </form>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mr-2 rounded-full h-8 w-8"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-center text-muted-foreground">
            Palm can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Palm;
