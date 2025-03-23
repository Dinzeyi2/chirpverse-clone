
import React, { useState, useRef, useEffect } from 'react';
import { Check, Copy, ChevronDown, ChevronUp, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, className }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fileName, setFileName] = useState(`${language}.${getFileExtension(language)}`);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const hasLongCode = code.split('\n').length > 10;
  const displayedCode = !expanded && hasLongCode 
    ? code.split('\n').slice(0, 10).join('\n') + '\n// ...'
    : code;
  
  const codeLines = displayedCode.split('\n');

  function getFileExtension(lang: string): string {
    switch (lang.toLowerCase()) {
      case 'javascript': return 'js';
      case 'typescript': return 'ts';
      case 'jsx': return 'jsx';
      case 'tsx': return 'tsx';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'python': return 'py';
      case 'ruby': return 'rb';
      case 'go': return 'go';
      case 'rust': return 'rs';
      case 'java': return 'java';
      case 'c': return 'c';
      case 'cpp': return 'cpp';
      case 'csharp': return 'cs';
      case 'php': return 'php';
      case 'swift': return 'swift';
      case 'kotlin': return 'kt';
      case 'json': return 'json';
      case 'yaml': return 'yaml';
      case 'markdown': return 'md';
      default: return language;
    }
  }

  function getColorForToken(token: string, currentLanguage: string): string {
    // Simple syntax highlighting based on token patterns
    const patterns = {
      keyword: /^(const|let|var|function|class|if|else|return|import|export|from|for|while|switch|case|break|continue|try|catch|throw|new|this|super|extends|implements|interface|type|enum|public|private|protected|static|async|await|yield|delete|typeof|instanceof|of|in|do|with)$/,
      string: /^(['"`]).*\1$/,
      number: /^\d+(\.\d+)?$/,
      boolean: /^(true|false)$/,
      comment: /^(\/\/|\/\*|\*\/).*$/,
      punctuation: /[{}[\]().,;:]/,
      operator: /[+\-*/%=&|^~<>!?]/,
      variable: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
    };

    // VSCode-like syntax highlighting colors
    if (token.trim() === 'import' || token.trim() === 'export' || token.trim() === 'from' || token.trim() === 'type' || token.trim() === 'const') {
      return 'text-[#C586C0]'; // purple for keywords like import/export/from/type
    } else if (patterns.keyword.test(token)) {
      return 'text-[#569CD6]'; // blue for keywords
    } else if (patterns.string.test(token) || token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      return 'text-[#CE9178]'; // brown-orange for strings
    } else if (patterns.number.test(token)) {
      return 'text-[#B5CEA8]'; // light green for numbers
    } else if (patterns.boolean.test(token)) {
      return 'text-[#569CD6]'; // blue for booleans
    } else if (patterns.comment.test(token) || token.startsWith('//') || token.startsWith('/*') || token.startsWith('*')) {
      return 'text-[#6A9955]'; // green for comments
    } else if (patterns.punctuation.test(token)) {
      return 'text-[#D4D4D4]'; // light gray for punctuation
    } else if (patterns.operator.test(token)) {
      return 'text-[#D4D4D4]'; // light gray for operators
    } else if (token === 'config' || token === 'Config') {
      return 'text-[#4EC9B0]'; // teal for types/interfaces
    } else if (token === 'DEFAULT') {
      return 'text-[#9CDCFE]'; // light blue for variables
    } else if (token.startsWith('hsl')) {
      return 'text-[#DCDCAA]'; // yellow for functions
    } else {
      return 'text-[#9CDCFE]'; // light blue default for variables
    }
  }

  function tokenizeLine(line: string, lang: string): JSX.Element[] {
    if (!line) return [<span key={0}>&nbsp;</span>];

    // Replace tabs with spaces for consistent rendering
    line = line.replace(/\t/g, '    ');

    // Handle different languages for better syntax highlighting
    if (lang === 'typescript' || lang === 'javascript' || lang === 'tsx' || lang === 'jsx') {
      // Split the line into tokens while preserving quotes
      const tokens: string[] = [];
      let currentToken = '';
      let inString = false;
      let stringChar = '';
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (!inString && (char === '"' || char === "'" || char === '`')) {
          // Start of string
          if (currentToken) tokens.push(currentToken);
          currentToken = char;
          inString = true;
          stringChar = char;
        } else if (inString && char === stringChar && line[i-1] !== '\\') {
          // End of string
          currentToken += char;
          tokens.push(currentToken);
          currentToken = '';
          inString = false;
        } else if (inString) {
          // Inside string
          currentToken += char;
        } else if (/\s/.test(char)) {
          // Whitespace
          if (currentToken) tokens.push(currentToken);
          tokens.push(char);
          currentToken = '';
        } else if (/[{}[\]().,;:]/.test(char)) {
          // Punctuation
          if (currentToken) tokens.push(currentToken);
          tokens.push(char);
          currentToken = '';
        } else {
          // Part of a token
          currentToken += char;
        }
      }
      
      if (currentToken) tokens.push(currentToken);
      
      return tokens.map((token, i) => {
        const color = getColorForToken(token, lang);
        return (
          <span key={i} className={color}>
            {token}
          </span>
        );
      });
    }
    
    // Default tokenization for other languages
    return line.split(/(\s+|[{}[\]().,;:]|\b)/).filter(Boolean).map((token, i) => {
      const color = getColorForToken(token, lang);
      return (
        <span key={i} className={color}>
          {token}
        </span>
      );
    });
  }

  return (
    <div className={cn(
      "my-4 rounded-lg overflow-hidden border border-gray-700 bg-[#1e1e1e]",
      "shadow-sm",
      className
    )}>
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-700">
        <div className="flex items-center text-sm text-gray-300">
          <FileCode size={16} className="mr-2 text-gray-400" />
          <span className="font-medium">{fileName}</span>
        </div>
        <div className="flex items-center space-x-2">
          {hasLongCode && (
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="p-1 text-gray-400 hover:text-gray-200"
              aria-label={expanded ? "Collapse code" : "Expand code"}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <button 
            onClick={copyToClipboard} 
            className="p-1 text-gray-400 hover:text-gray-200"
            aria-label="Copy code"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
      </div>
      <ScrollArea className={expanded ? 'h-[80vh]' : 'h-[400px]'}>
        <div className="relative">
          <div className="flex text-sm font-mono">
            <div className="py-4 pl-4 pr-3 text-right select-none bg-[#1e1e1e] text-gray-500 border-r border-gray-700 min-w-[2.5rem]">
              {codeLines.map((_, i) => (
                <div key={i} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="overflow-x-auto w-full">
              <pre className="py-4 pl-4 pr-4 font-mono whitespace-pre">
                <code className="text-sm text-[#D4D4D4]">
                  {codeLines.map((line, i) => (
                    <div key={i} className="leading-6">
                      {tokenizeLine(line, language)}
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default CodeBlock;
