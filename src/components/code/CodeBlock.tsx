import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
  expanded?: boolean;
  inPost?: boolean;
}

interface SyntaxToken {
  text: string;
  type: 'keyword' | 'string' | 'number' | 'boolean' | 'comment' | 'punctuation' | 'operator' | 'variable' | 'function' | 'type' | 'regex' | 'plain';
  color: string;
}

const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super'],
  typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super', 'interface', 'type', 'enum', 'namespace', 'implements', 'extends'],
  python: ['def', 'class', 'import', 'from', 'if', 'elif', 'else', 'try', 'except', 'finally', 'for', 'while', 'return', 'and', 'or', 'not', 'in', 'is', 'lambda', 'with', 'as', 'assert', 'break', 'continue', 'global', 'pass'],
  java: ['public', 'private', 'protected', 'class', 'interface', 'enum', 'extends', 'implements', 'import', 'package', 'static', 'final', 'void', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'throw', 'throws', 'new', 'this', 'super'],
};

const LANGUAGE_TYPES: Record<string, string[]> = {
  javascript: ['Array', 'Object', 'String', 'Number', 'Boolean', 'Function', 'Promise', 'Map', 'Set', 'Date', 'RegExp', 'Error'],
  typescript: ['string', 'number', 'boolean', 'any', 'void', 'null', 'undefined', 'never', 'unknown', 'Array', 'Record', 'Promise', 'Map', 'Set', 'Date', 'Partial', 'Required', 'Pick', 'Omit', 'Exclude', 'Extract', 'NonNullable', 'ReturnType'],
};

function tokenizeCode(code: string, language: string): SyntaxToken[] {
  if (!code) return [];
  
  const tokens: SyntaxToken[] = [];
  
  const patterns = {
    string: /(["'`])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g,
    comment: /\/\/.*|\/\*[\s\S]*?\*\//g,
    number: /\b-?\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/gi,
    boolean: /\b(?:true|false)\b/g,
    operator: /[+\-*/%=&|^~<>!?]+/g,
    punctuation: /[{}[\];(),.:]/g,
  };

  let remainingCode = code;
  
  const commentMatches = [...remainingCode.matchAll(patterns.comment)];
  for (const match of commentMatches) {
    if (match.index !== undefined) {
      if (match.index > 0) {
        const beforeText = remainingCode.substring(0, match.index);
        remainingCode = remainingCode.substring(0, match.index);
        processRemainingText(beforeText);
      }
      
      tokens.push({
        text: match[0],
        type: 'comment',
        color: '#6A9955'
      });
      
      remainingCode = remainingCode.substring(match.index + match[0].length);
    }
  }
  
  processRemainingText(remainingCode);
  
  function processRemainingText(text: string) {
    text = processPattern(text, patterns.string, 'string', '#CE9178');
    text = processPattern(text, patterns.number, 'number', '#B5CEA8');
    text = processPattern(text, patterns.boolean, 'boolean', '#569CD6');
    text = processPattern(text, patterns.operator, 'operator', '#D4D4D4');
    text = processPattern(text, patterns.punctuation, 'punctuation', '#D4D4D4');
    
    const words = text.split(/\b/);
    for (const word of words) {
      if (!word.trim()) {
        if (word) tokens.push({ text: word, type: 'plain', color: '#D4D4D4' });
        continue;
      }
      
      if (LANGUAGE_KEYWORDS[language]?.includes(word)) {
        tokens.push({ text: word, type: 'keyword', color: '#569CD6' });
      } else if (LANGUAGE_TYPES[language]?.includes(word)) {
        tokens.push({ text: word, type: 'type', color: '#4EC9B0' });
      } else {
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/.test(word)) {
          tokens.push({ text: word, type: 'function', color: '#DCDCAA' });
        } else {
          tokens.push({ text: word, type: 'plain', color: '#D4D4D4' });
        }
      }
    }
  }
  
  function processPattern(text: string, pattern: RegExp, type: SyntaxToken['type'], color: string): string {
    let result = '';
    let lastIndex = 0;
    let match;
    
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(text)) !== null) {
      if (match.index === undefined) continue;
      
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          tokens.push({ text: beforeText, type: 'plain', color: '#D4D4D4' });
        }
      }
      
      tokens.push({ text: match[0], type, color });
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      result = text.substring(lastIndex);
    }
    
    return result;
  }
  
  return tokens;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, className, expanded: initialExpanded = false, inPost = false }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(initialExpanded || inPost);
  const [fileName, setFileName] = useState(`${language}.${getFileExtension(language)}`);
  const [highlightedCode, setHighlightedCode] = useState<React.ReactNode[]>([]);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const hasLongCode = code.split('\n').length > 10;
  const displayedCode = !expanded && hasLongCode && !inPost
    ? code.split('\n').slice(0, 10).join('\n') + '\n// ...'
    : code;

  useEffect(() => {
    const codeLines = displayedCode.split('\n');
    
    const highlighted = codeLines.map((line, lineIndex) => {
      const lineTokens = tokenizeLine(line, language);
      return (
        <div key={lineIndex} className="leading-6">
          {lineTokens}
        </div>
      );
    });
    
    setHighlightedCode(highlighted);
  }, [displayedCode, language]);

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

  function tokenizeLine(line: string, lang: string): JSX.Element[] {
    if (!line) return [<span key={0}>&nbsp;</span>];
    
    const tokens = tokenizeCode(line, lang);
    
    return tokens.map((token, i) => (
      <span key={i} style={{ color: token.color }}>
        {token.text}
      </span>
    ));
  }

  const lineNumbers = displayedCode.split('\n').map((_, i) => i + 1);

  const calculateMaxHeight = () => {
    if (inPost) {
      return 'max-h-[500px]';
    } else if (expanded) {
      return 'max-h-[70vh]';
    } else {
      return 'max-h-[400px]';
    }
  };

  const maxHeight = calculateMaxHeight();

  return (
    <div className={cn(
      "my-2 overflow-hidden border border-gray-700 bg-[#1e1e1e]",
      "shadow-sm relative",
      inPost ? "w-full" : "",
      className
    )}>
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-700 sticky top-0 z-10">
        <div className="flex items-center text-sm text-gray-300">
          <FileCode size={16} className="mr-2 text-gray-400" />
          <span className="font-medium">{fileName}</span>
        </div>
        <div className="flex items-center space-x-2">
          {hasLongCode && !inPost && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }} 
              className="p-1 text-gray-400 hover:text-gray-200"
              aria-label={expanded ? "Collapse code" : "Expand code"}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard();
            }} 
            className="p-1 text-gray-400 hover:text-gray-200"
            aria-label="Copy code"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
      </div>
      
      <div 
        className={cn(maxHeight, "relative overflow-hidden")}
        ref={codeContainerRef}
      >
        <ScrollArea className="h-full w-full">
          <div className="min-w-max">
            <div className="flex text-sm font-mono">
              <div className="py-4 pl-4 pr-3 text-right select-none bg-[#1e1e1e] text-gray-500 border-r border-gray-700 min-w-[2.5rem] flex-shrink-0">
                {lineNumbers.map((num) => (
                  <div key={num} className="leading-6 relative">
                    {num}
                  </div>
                ))}
              </div>
              <div className="relative flex-grow">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  {lineNumbers.map((num) => (
                    <div key={num} className="h-6 border-b border-gray-800/20"></div>
                  ))}
                </div>
                <pre className="py-4 pl-4 pr-10 overflow-x-auto font-mono text-sm whitespace-pre relative z-10">
                  <code className="text-[#D4D4D4] block min-w-max">
                    {highlightedCode}
                  </code>
                </pre>
              </div>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  );
};

export default CodeBlock;
