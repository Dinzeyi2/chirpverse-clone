
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ImageIcon, PlusCircle, Plus, MoreHorizontal, Search, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { Canvas } from '@/components/palm/Canvas';
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';
import CodeBlock from '@/components/code/CodeBlock';
import CodeEditor from '@/components/palm/CodeEditor';

// Define a proper type for chat messages
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const Palm = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [codeContent, setCodeContent] = useState<string>('');

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
      
      // Extract code blocks from the response to display in code editor
      const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/g;
      const matches = [...data.message.matchAll(codeBlockRegex)];
      if (matches.length > 0) {
        // Use the first code block found in the response
        setCodeContent(matches[0][1]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCanvas = () => {
    setShowCanvas(!showCanvas);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCodeContent('');
    setShowCanvas(false);
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white">
      {/* Left panel - Chat */}
      <div className="flex flex-col h-full w-1/2 border-r border-gray-200">
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h1 className="text-xl font-semibold">Palm</h1>
          <Button variant="outline" size="sm" onClick={handleNewChat} className="rounded-md">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Messages Container */}
        <div className="flex-grow overflow-y-auto px-4 py-4 bg-white">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="text-2xl font-semibold mb-4">How can I help you today?</h2>
              <p className="text-gray-500">Ask me to write or explain code, debug an issue, or discuss programming concepts.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[95%] rounded-lg px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-gray-100 text-gray-800 rounded-2xl' 
                        : 'bg-white text-gray-800 border border-gray-200 rounded-2xl'
                    }`}
                  >
                    {message.role === 'user' ? (
                      message.content
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2">{children}</p>,
                          h1: ({ children }) => <h1 className="text-xl font-bold my-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-bold my-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-md font-bold my-2">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc pl-5 my-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
                          li: ({ children }) => <li className="my-1">{children}</li>,
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {children}
                            </a>
                          ),
                          em: ({ children }) => <em className="italic">{children}</em>,
                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2">{children}</blockquote>
                          ),
                          code: ({ className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <CodeBlock
                                code={String(children).replace(/\n$/, '')}
                                language={match[1]}
                                className="my-2"
                              />
                            ) : (
                              <code
                                className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2 bg-white text-gray-800 border border-gray-200 rounded-2xl px-4 py-3">
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

        {showCanvas && (
          <div className="p-4 border-t border-gray-200">
            <Canvas />
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-2 mx-auto w-full">            
            <div className="flex items-center w-full rounded-lg border border-gray-300 bg-white shadow-sm">
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
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                <Plus className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                <Lightbulb className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-center text-gray-500 mt-2">
            Palm may make mistakes. Check important info.
          </div>
        </div>
      </div>
      
      {/* Right panel - Code Editor */}
      <div className="h-full w-1/2 bg-white">
        <CodeEditor content={codeContent} />
      </div>
    </div>
  );
};

export default Palm;
