
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
import { Input } from '@/components/ui/input';

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
    <AppLayout>
      <div className="flex w-full h-[calc(100vh-20px)] overflow-hidden">
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
                            p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                            h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-2" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-md font-bold my-2" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2" {...props} />,
                            li: ({ node, ...props }) => <li className="my-1" {...props} />,
                            a: ({ node, href, children, ...props }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" {...props}>
                                {children}
                              </a>
                            ),
                            em: ({ node, ...props }) => <em className="italic" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                            blockquote: ({ node, ...props }) => (
                              <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />
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

          {/* Input Area - Updated to match the provided design */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex flex-col mx-auto w-full">
              <div className="relative flex items-center w-full rounded-2xl border border-gray-300 bg-white shadow-sm">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything"
                  className="w-full py-3 px-4 bg-transparent border-none focus:outline-none text-sm min-h-[44px] max-h-[200px] resize-none"
                  rows={1}
                  disabled={isLoading}
                  style={{ overflow: 'auto' }}
                />
                <div className="absolute right-2 bottom-2">
                  <Button 
                    type="submit" 
                    size="icon"
                    variant="ghost"
                    onClick={handleSubmit}
                    className="rounded-full h-8 w-8 bg-black text-white hover:bg-gray-800" 
                    disabled={!input.trim() || isLoading}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-center mt-2 space-x-2">
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border border-gray-300">
                  <Plus className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border border-gray-300 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                  <span className="ml-1 text-sm">Search</span>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border border-gray-300 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-1" />
                  <span className="text-sm">Reason</span>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border border-gray-300">
                  <MoreHorizontal className="h-5 w-5" />
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
    </AppLayout>
  );
};

export default Palm;
