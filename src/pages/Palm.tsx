
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, PlusCircle, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { Canvas } from '@/components/palm/Canvas';
import { supabase } from "@/integrations/supabase/client";
import { SquareCode } from 'lucide-react';
import CodeDialog from '@/components/code/CodeDialog';
import CodeEditorDialog from '@/components/code/CodeEditorDialog';

// Define a proper type for chat messages
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const Palm = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [codeContent, setCodeContent] = useState('');
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
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
    
    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    
    try {
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
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.message };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCode = () => {
    setIsCodeDialogOpen(!isCodeDialogOpen);
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowCode(false);
    setCodeContent('');
  };

  const handleSaveCode = (code: string, language: string) => {
    setCodeContent(code);
    // Here you could also add logic to send the code to the chat if needed
  };

  const initialCodeContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeQuery - Coder Social Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @font-face {
      font-family: 'LucideIcons';
      src: url(https://cdn.jsdelivr.net/npm/lucide-static@latest/font/Lucide.ttf);
    }
    .lucide {
      font-family: 'LucideIcons';
      font-style: normal;
      font-weight: normal;
      font-variant: normal;
      text-rendering: auto;
      line-height: 1;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      display: inline-block; /* Ensure icons behave like inline elements */
      vertical-align: middle; /* Align icons nicely with text */
    }
  </style>
</head>
<body>
  <!-- Your code here -->
</body>
</html>`;

  return (
    <AppLayout>
      <div className="flex h-screen max-h-[calc(100vh-64px)]">
        <div className="flex flex-col w-full h-full transition-all duration-300">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <h1 className="text-2xl font-semibold">Palm</h1>
            <Button variant="outline" size="sm" onClick={handleNewChat}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          <div className="flex-grow overflow-y-auto px-4 pb-4 pt-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-3xl font-bold mb-4">What can I help with?</h2>
                <p className="text-muted-foreground">Ask anything...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user' 
                          ? 'bg-[#2196f3] text-white rounded-2xl' 
                          : 'bg-[#f5f5f1] text-[#1f1f1f] rounded-2xl'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-2 bg-[#f5f5f1] text-[#1f1f1f] rounded-2xl px-4 py-3">
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

          <div className="border-t border-border p-4">
            <div className="flex flex-col gap-2 max-w-full mx-auto w-full">
              <div className="flex items-center rounded-full border border-border bg-background shadow-sm p-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full flex-shrink-0 mr-1"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className={`rounded-full flex items-center ${isCodeDialogOpen ? 'bg-primary/10' : ''} mr-1`}
                  onClick={toggleCode}
                >
                  <SquareCode className="h-4 w-4 mr-1" />
                  Code
                </Button>
                
                <form onSubmit={handleSubmit} className="flex items-center flex-grow">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything"
                    className="w-full py-2 px-3 bg-transparent border-none focus:outline-none text-sm"
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
            </div>
          </div>
        </div>
      </div>

      {/* Use the CodeEditorDialog component instead of inline code */}
      <CodeEditorDialog
        open={isCodeDialogOpen}
        onClose={() => setIsCodeDialogOpen(false)}
        onSave={handleSaveCode}
      />
    </AppLayout>
  );
};

export default Palm;
