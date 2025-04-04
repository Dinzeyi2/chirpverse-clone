
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, PlusCircle, Plus, MoreHorizontal, SquareCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { Canvas } from '@/components/palm/Canvas';
import { supabase } from "@/integrations/supabase/client";
import CodeEditorDialog from '@/components/code/CodeEditorDialog';
import CodeBlock from '@/components/code/CodeBlock';

// Define a proper type for chat messages
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  codeBlocks?: { code: string; language: string }[];
};

const Palm = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeContent, setCodeContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to parse code blocks from text content with improved regex
  const parseCodeBlocks = (content: string) => {
    // Regular expression to match code blocks: ```language\ncode\n```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const codeBlocks: { code: string; language: string }[] = [];
    
    // Find all code blocks in the content
    let match;
    let lastIndex = 0;
    let newContent = '';
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      newContent += content.substring(lastIndex, match.index) + '[CODE_BLOCK_' + codeBlocks.length + ']';
      
      // Extract language and code
      const language = match[1] || 'typescript';
      const code = match[2];
      
      // Add to code blocks array
      codeBlocks.push({ language, code });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last code block
    newContent += content.substring(lastIndex);
    
    return { content: newContent, codeBlocks };
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
      
      // Parse code blocks from the response
      const { content, codeBlocks } = parseCodeBlocks(data.message);
      
      // Add assistant message with explicit typing and code blocks
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content, 
        codeBlocks 
      };
      
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
    if (showCodeEditor) setShowCodeEditor(false);
  };

  const toggleCodeEditor = () => {
    setShowCodeEditor(!showCodeEditor);
    if (showCanvas) setShowCanvas(false);
  };

  const handleCodeInsert = (code: string, language: string) => {
    // Add the code to the input with markdown code block syntax
    const codeBlock = `\`\`\`${language}\n${code}\n\`\`\``;
    setInput(prev => prev + '\n' + codeBlock);
    setShowCodeEditor(false);
  };

  const renderMessageContent = (message: ChatMessage) => {
    if (!message.codeBlocks || message.codeBlocks.length === 0) {
      return <div className="whitespace-pre-wrap">{message.content}</div>;
    }
    
    // Split the content by code block placeholders
    const parts = message.content.split(/\[CODE_BLOCK_(\d+)\]/);
    
    return (
      <div className="space-y-2">
        {parts.map((part, index) => {
          // Even indices are text parts
          if (index % 2 === 0) {
            return part ? <div key={index} className="whitespace-pre-wrap">{part}</div> : null;
          }
          
          // Odd indices are code block references
          const codeBlockIndex = parseInt(part, 10);
          const codeBlock = message.codeBlocks[codeBlockIndex];
          
          if (!codeBlock) return null;
          
          return (
            <div key={index} className="w-full">
              <CodeBlock 
                code={codeBlock.code} 
                language={codeBlock.language} 
                inPost={true}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowCanvas(false);
    setShowCodeEditor(false);
    setCodeContent('');
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
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-[#2196f3] text-white rounded-2xl' 
                        : 'bg-[#f5f5f1] text-[#1f1f1f] rounded-2xl'
                    }`}
                  >
                    {renderMessageContent(message)}
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

        {showCanvas && (
          <div className="p-4 border-t border-border">
            <Canvas />
          </div>
        )}

        {/* Code Editor Dialog */}
        <CodeEditorDialog
          open={showCodeEditor}
          onClose={() => setShowCodeEditor(false)}
          onSave={handleCodeInsert}
        />

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className={`h-10 w-10 rounded-full flex-shrink-0 ${showCanvas ? 'bg-blue-100 text-blue-600' : ''}`}
                onClick={toggleCanvas}
              >
                <Plus className="h-5 w-5" />
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className={`h-10 w-10 rounded-full flex-shrink-0 ${showCodeEditor ? 'bg-blue-100 text-blue-600' : ''}`}
                onClick={toggleCodeEditor}
              >
                <SquareCode className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center w-full rounded-2xl border border-border bg-background shadow-sm">
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
