
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ImageIcon, Plus, MoreHorizontal, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { Canvas } from '@/components/palm/Canvas';
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';
import CodeBlock from '@/components/code/CodeBlock';
import { useTheme } from '@/components/theme/theme-provider';
import { cn } from '@/lib/utils';

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
  const [extractedCode, setExtractedCode] = useState<string>('');
  const [lineNumbers, setLineNumbers] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    // Generate line numbers for code display
    if (extractedCode) {
      const lines = extractedCode.split('\n');
      setLineNumbers(Array.from({ length: lines.length }, (_, i) => String(i + 1)));
    }
  }, [extractedCode]);

  useEffect(() => {
    // Extract code from the last assistant message
    if (messages.length > 0) {
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistantMessage) {
        const codeBlockRegex = /```(?:html|css|js|javascript|typescript|jsx|tsx)?\n([\s\S]*?)```/g;
        const matches = [...lastAssistantMessage.content.matchAll(codeBlockRegex)];
        
        if (matches.length > 0) {
          // Use the last code block if there are multiple
          setExtractedCode(matches[matches.length - 1][1]);
        } else {
          setExtractedCode('');
        }
      }
    }
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

  const copyCodeToClipboard = () => {
    if (extractedCode) {
      navigator.clipboard.writeText(extractedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success("Code copied to clipboard");
    }
  };

  return (
    <AppLayout>
      <div className="flex h-screen w-full">
        {/* Left side - Chat */}
        <div 
          ref={chatContainerRef}
          className={cn(
            "w-1/2 h-screen flex flex-col border-r",
            theme === "dark" ? "border-gray-800 bg-black" : "border-gray-200 bg-[#f7f7f8]"
          )}
        >
          {/* Chat Messages */}
          <div className="flex-grow overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <h2 className="text-3xl font-bold mb-4">How can I help you today?</h2>
                <p className="text-muted-foreground max-w-md">
                  Ask anything from simple questions to complex problems. I'm here to help with coding, explanations, and more.
                </p>
              </div>
            ) : (
              <div className="space-y-6 w-full max-w-2xl mx-auto">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "px-4 py-6 w-full",
                      message.role === 'user' 
                        ? theme === "dark" ? "bg-[#343541]" : "bg-white" 
                        : theme === "dark" ? "bg-[#444654]" : "bg-[#f7f7f8]"
                    )}
                  >
                    <div className="max-w-2xl mx-auto flex">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center mr-4 flex-shrink-0 text-sm",
                        message.role === 'user' 
                          ? "bg-[#5436DA] text-white" 
                          : "bg-[#19c37d] text-white"
                      )}>
                        {message.role === 'user' ? 'U' : 'AI'}
                      </div>
                      <div className="prose dark:prose-invert max-w-none">
                        {message.role === 'user' ? (
                          <p>{message.content}</p>
                        ) : (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-4">{children}</p>,
                              h1: ({ children }) => <h1 className="text-xl font-bold my-4">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-bold my-3">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-md font-bold my-2">{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc pl-5 my-4">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-5 my-4">{children}</ol>,
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
                              code: ({ className, children }) => {
                                const match = /language-(\w+)/.exec(className || '');
                                return match ? (
                                  <CodeBlock
                                    code={String(children).replace(/\n$/, '')}
                                    language={match[1]}
                                    className="my-4"
                                  />
                                ) : (
                                  <code
                                    className={cn(
                                      "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded font-mono text-sm",
                                    )}
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
                  </div>
                ))}
                {isLoading && (
                  <div className={cn(
                    "px-4 py-6 w-full",
                    theme === "dark" ? "bg-[#444654]" : "bg-[#f7f7f8]"
                  )}>
                    <div className="max-w-2xl mx-auto flex">
                      <div className="w-7 h-7 rounded-full bg-[#19c37d] text-white flex items-center justify-center mr-4 flex-shrink-0 text-sm">
                        AI
                      </div>
                      <div className="flex space-x-2 items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className={cn(
            "p-4 border-t",
            theme === "dark" ? "border-gray-800" : "border-gray-200"
          )}>
            <div className="max-w-2xl mx-auto">
              <form 
                onSubmit={handleSubmit} 
                className={cn(
                  "flex items-end rounded-lg shadow-sm border",
                  theme === "dark" ? "border-gray-700 bg-[#40414f]" : "border-gray-300 bg-white"
                )}
              >
                <div className="flex-grow px-3 py-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message Gemini..."
                    className={cn(
                      "w-full resize-none bg-transparent border-0 focus:ring-0 focus:outline-none max-h-32",
                      theme === "dark" ? "text-white placeholder:text-gray-400" : "text-gray-900 placeholder:text-gray-500"
                    )}
                    rows={1}
                    style={{ height: 'auto', minHeight: '24px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim()) handleSubmit(e);
                      }
                    }}
                  />
                </div>
                <div className="pr-2 pb-2">
                  <Button 
                    type="submit" 
                    size="icon"
                    className={cn(
                      "rounded-md h-8 w-8",
                      !input.trim() || isLoading 
                        ? "text-gray-400 cursor-not-allowed" 
                        : "bg-[#19c37d] text-white hover:bg-[#15a76c]"
                    )}
                    disabled={!input.trim() || isLoading}
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </div>
              </form>
              <div className="text-xs text-center mt-2 text-gray-500">
                Gemini is an AI by Google. Your inputs may be used to improve the service.
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Code editor */}
        <div className={cn(
          "w-1/2 h-screen overflow-hidden flex flex-col",
          theme === "dark" ? "bg-[#1e1e1e]" : "bg-white"
        )}>
          {extractedCode ? (
            <>
              <div className={cn(
                "flex items-center justify-between px-4 py-2 border-b",
                theme === "dark" ? "border-gray-800 bg-[#2d2d2d]" : "border-gray-200 bg-gray-100"
              )}>
                <div className="text-sm font-medium">Code</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-xs gap-1"
                  onClick={copyCodeToClipboard}
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy code
                    </>
                  )}
                </Button>
              </div>
              <div className="flex-grow overflow-auto">
                <div className="flex">
                  <div className={cn(
                    "p-4 text-right pr-2 select-none text-sm font-mono",
                    theme === "dark" ? "text-gray-500 bg-[#252525]" : "text-gray-400 bg-gray-50"
                  )}>
                    {lineNumbers.map((num, i) => (
                      <div key={i} className="h-6 leading-6">{num}</div>
                    ))}
                  </div>
                  <pre className={cn(
                    "p-4 pl-0 flex-grow overflow-auto font-mono text-sm leading-6",
                    theme === "dark" ? "text-gray-300" : "text-gray-800"
                  )}>
                    <code>
                      {extractedCode.split('\n').map((line, i) => (
                        <div key={i} className="h-6">
                          {line || ' '}
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className={cn(
                "rounded-full p-3 mb-4",
                theme === "dark" ? "bg-gray-800" : "bg-gray-100"
              )}>
                <div className="w-10 h-10 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M8 3L4 7L8 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 3L20 7L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 21L14 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">No code detected</h3>
              <p className="text-gray-500 max-w-md">
                Ask Gemini to generate code or provide a code example, and it will appear here for easy copying and reference.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Palm;
