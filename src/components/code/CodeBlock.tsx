
import React, { useState, useRef, useEffect } from 'react';
import { Check, Copy, ChevronDown, ChevronUp, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    // CSS language-specific colors
    if (token.trim().startsWith('import') || token.trim().startsWith('export') || token.trim().startsWith('from')) {
      return 'text-pink-500 dark:text-pink-400'; // import/export statements
    } else if (patterns.keyword.test(token)) {
      return 'text-purple-600 dark:text-purple-400'; // keywords
    } else if (patterns.string.test(token) || token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      return 'text-green-600 dark:text-green-400'; // strings
    } else if (patterns.number.test(token)) {
      return 'text-blue-600 dark:text-blue-400'; // numbers
    } else if (patterns.boolean.test(token)) {
      return 'text-blue-600 dark:text-blue-400'; // booleans
    } else if (patterns.comment.test(token) || token.startsWith('//') || token.startsWith('/*') || token.startsWith('*')) {
      return 'text-gray-500 dark:text-gray-400'; // comments
    } else if (patterns.punctuation.test(token)) {
      return 'text-gray-600 dark:text-gray-300'; // punctuation
    } else if (patterns.operator.test(token)) {
      return 'text-red-500 dark:text-red-400'; // operators
    } else if (token === 'DEFAULT' || token === 'config') {
      return 'text-blue-500 dark:text-blue-400'; // special variables
    } else if (token.startsWith('hsl')) {
      return 'text-green-500 dark:text-green-400'; // hsl values
    } else {
      return ''; // default color
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
      "my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900",
      "shadow-sm",
      className
    )}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <FileCode size={16} className="mr-2" />
          <span className="font-medium">{fileName}</span>
        </div>
        <div className="flex items-center space-x-2">
          {hasLongCode && (
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={expanded ? "Collapse code" : "Expand code"}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <button 
            onClick={copyToClipboard} 
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Copy code"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
      </div>
      <div className="relative overflow-x-auto">
        <div className="flex text-sm font-mono">
          <div className="py-4 pl-4 pr-3 text-right select-none bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 min-w-[2.5rem]">
            {codeLines.map((_, i) => (
              <div key={i} className="leading-6">
                {i + 1}
              </div>
            ))}
          </div>
          <pre className="overflow-x-auto py-4 pl-4 pr-4 flex-grow">
            <code className="font-mono whitespace-pre text-sm">
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
  );
};

export default CodeBlock;
