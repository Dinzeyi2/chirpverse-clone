
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ImageIcon, PlusCircle, RefreshCw, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { Canvas } from '@/components/palm/Canvas';

const Palm = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
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
    
    const userMessage = input;
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    try {
      // Simulating AI response
      setTimeout(() => {
        const response = `Thanks for your message: "${userMessage}". This is a simulated response. In a real implementation, this would connect to an AI service.`;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setIsLoading(false);
      }, 1000);
      
      // In a real implementation, you would call your AI API here
      // const response = await fetch('/api/palm', { 
      //   method: 'POST', 
      //   body: JSON.stringify({ message: userMessage }),
      //   headers: { 'Content-Type': 'application/json' }
      // });
      // const data = await response.json();
      // setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      setIsLoading(false);
    }
  };

  const toggleCanvas = () => {
    setShowCanvas(!showCanvas);
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowCanvas(false);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen max-h-[calc(100vh-64px)] pt-4">
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
                    className={`max-w-[80%] rounded-lg px-4 py-2 
                      ${message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground'}`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2 bg-secondary text-secondary-foreground rounded-lg px-4 py-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {showCanvas && (
          <div className="p-4 border-t border-border">
            <Canvas />
          </div>
        )}

        {/* Input Area - Updated to match the reference image */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 rounded-full flex-shrink-0"
            >
              <Plus className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center w-full rounded-2xl border border-border bg-background shadow-sm">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="ml-2 px-2 rounded-full"
                onClick={toggleCanvas}
              >
                <ImageIcon className="h-5 w-5" />
                <span className="ml-1">Create image</span>
              </Button>
              
              <div className="flex-grow px-2">
                <form onSubmit={handleSubmit} className="flex items-center w-full">
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
        </div>
      </div>
    </AppLayout>
  );
};

export default Palm;
