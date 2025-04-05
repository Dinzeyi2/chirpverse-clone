
import React, { useState, useEffect } from 'react';
import { Code, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

type CodeEditorV2Props = {
  code: string;
  language?: string;
};

const CodeEditorV2: React.FC<CodeEditorV2Props> = ({ code, language = 'html' }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [lines, setLines] = useState<string[]>([]);
  
  useEffect(() => {
    if (code) {
      setLines(code.split('\n'));
    }
  }, [code]);

  const formatToken = (token: string): JSX.Element => {
    // Simple syntax highlighting rules based on language and token patterns
    if (language === 'html' || language === 'jsx' || language === 'tsx') {
      // HTML Tags
      if (token.match(/^<\/?[a-zA-Z][a-zA-Z0-9]*>$/)) {
        return <span className="text-blue-400">{token}</span>;
      }
      // Opening tag with attributes
      if (token.match(/^<[a-zA-Z][a-zA-Z0-9]*$/)) {
        return <span className="text-blue-400">{token}</span>;
      }
      // Closing part of tag
      if (token.match(/^>$/)) {
        return <span className="text-blue-400">{token}</span>;
      }
      // Closing tag part
      if (token.match(/^<\/$/)) {
        return <span className="text-blue-400">{token}</span>;
      }
      // Attributes
      if (token.match(/^[a-zA-Z][a-zA-Z0-9\-]*=$/)) {
        return <span className="text-cyan-300">{token}</span>;
      }
      // Attribute values
      if (token.match(/^"[^"]*"$/)) {
        return <span className="text-amber-400">{token}</span>;
      }
      // DOCTYPE
      if (token.includes('DOCTYPE')) {
        return <span className="text-blue-400">{token}</span>;
      }
    }
    
    // CSS specific highlighting
    if (language === 'css' || token.match(/^style/) || lines.some(line => line.includes('<style>'))) {
      // CSS classes, ids, and selectors
      if (token.match(/^\.[a-zA-Z][a-zA-Z0-9\-_]*$/)) {
        return <span className="text-cyan-300">{token}</span>;
      }
      // CSS properties
      if (token.match(/^[a-zA-Z\-]+:$/)) {
        return <span className="text-cyan-300">{token}</span>;
      }
      // CSS values
      if (token.match(/^[a-zA-Z0-9\-]+;$/)) {
        return <span className="text-amber-400">{token}</span>;
      }
      // CSS units
      if (token.match(/^[0-9]+[a-zA-Z%]+;?$/)) {
        return <span className="text-green-400">{token}</span>;
      }
      // CSS functions
      if (token.match(/^url\(/) || token.match(/^format\(/)) {
        return <span className="text-amber-400">{token}</span>;
      }
    }
    
    // JavaScript/TypeScript tokens
    if (language === 'javascript' || language === 'typescript' || language === 'jsx' || language === 'tsx' || token.match(/^script/) || lines.some(line => line.includes('<script>'))) {
      // Keywords
      if (['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'from'].includes(token)) {
        return <span className="text-pink-400">{token}</span>;
      }
      // Values
      if (['true', 'false', 'null', 'undefined'].includes(token)) {
        return <span className="text-amber-400">{token}</span>;
      }
      // Numbers
      if (token.match(/^[0-9]+(\.[0-9]+)?$/)) {
        return <span className="text-green-400">{token}</span>;
      }
      // Strings
      if (token.match(/^['"`].*['"`]$/)) {
        return <span className="text-amber-400">{token}</span>;
      }
      // Comments
      if (token.startsWith('//') || token.startsWith('/*')) {
        return <span className="text-gray-500">{token}</span>;
      }
    }
    
    return <span>{token}</span>;
  };
  
  const renderLine = (line: string, index: number) => {
    // Simple tokenization by spaces with preservation of whitespace
    const tokens = [];
    let currentToken = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if ((char === '"' || char === "'" || char === '`') && (i === 0 || line[i-1] !== '\\')) {
        if (inString && char === stringChar) {
          currentToken += char;
          tokens.push(currentToken);
          currentToken = '';
          inString = false;
          stringChar = '';
        } else if (!inString) {
          if (currentToken) tokens.push(currentToken);
          currentToken = char;
          inString = true;
          stringChar = char;
        } else {
          currentToken += char;
        }
        continue;
      }
      
      if (inString) {
        currentToken += char;
        continue;
      }
      
      if (char === ' ') {
        if (currentToken) tokens.push(currentToken);
        tokens.push(' ');
        currentToken = '';
      } else if (['<', '>', '=', '{', '}', '(', ')', ';', ':', ','].includes(char)) {
        if (currentToken) tokens.push(currentToken);
        tokens.push(char);
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    
    if (currentToken) tokens.push(currentToken);
    
    return (
      <div key={index} className="flex whitespace-pre">
        {tokens.map((token, i) => (
          <React.Fragment key={i}>
            {token === ' ' ? ' ' : formatToken(token)}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-[#1e1e1e] border border-gray-700 rounded-md overflow-hidden text-white">
      {/* Header with tabs */}
      <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-gray-700 p-2">
        <div className="flex items-center">
          <div className="flex space-x-1 items-center">
            <div className="text-gray-400 ml-2">Coder Social Platform Prototype...</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded-md overflow-hidden">
            <button 
              className={cn(
                "px-4 py-1 text-sm flex items-center gap-1", 
                activeTab === 'code' ? "bg-[#0e639c] text-white" : "text-gray-300"
              )}
              onClick={() => setActiveTab('code')}
            >
              <Code size={14} />
              Code
            </button>
            <button 
              className={cn(
                "px-4 py-1 text-sm flex items-center gap-1", 
                activeTab === 'preview' ? "bg-[#0e639c] text-white" : "text-gray-300"
              )}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={14} />
              Aperçu
            </button>
          </div>
        </div>
      </div>
      
      {/* Code content */}
      {activeTab === 'code' && (
        <div className="relative h-full overflow-auto">
          <div className="flex">
            {/* Line numbers */}
            <div className="bg-[#1e1e1e] text-gray-500 text-right pr-3 pl-2 pt-1 select-none border-r border-gray-700 min-w-[40px]">
              {lines.map((_, index) => (
                <div key={index} className="leading-6 text-xs">
                  {index + 1}
                </div>
              ))}
            </div>
            
            {/* Code with syntax highlighting */}
            <div className="p-1 pl-4 text-gray-300 font-mono text-sm">
              {lines.map((line, index) => (
                <div key={index} className="leading-6">
                  {renderLine(line, index)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Preview content */}
      {activeTab === 'preview' && (
        <div className="p-4 bg-white h-full overflow-auto">
          <div className="prose max-w-none">
            {code && <div dangerouslySetInnerHTML={{ __html: code }} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditorV2;
