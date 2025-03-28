import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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

// Language-specific keywords for syntax highlighting
const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super'],
  typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super', 'interface', 'type', 'enum', 'namespace', 'implements', 'extends'],
  python: ['def', 'class', 'import', 'from', 'if', 'elif', 'else', 'try', 'except', 'finally', 'for', 'while', 'return', 'and', 'or', 'not', 'in', 'is', 'lambda', 'with', 'as', 'assert', 'break', 'continue', 'global', 'pass'],
  java: ['public', 'private', 'protected', 'class', 'interface', 'enum', 'extends', 'implements', 'import', 'package', 'static', 'final', 'void', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'throw', 'throws', 'new', 'this', 'super'],
  // Add more languages as needed
};

// Built-in types for each language
const LANGUAGE_TYPES: Record<string, string[]> = {
  javascript: ['Array', 'Object', 'String', 'Number', 'Boolean', 'Function', 'Promise', 'Map', 'Set', 'Date', 'RegExp', 'Error'],
  typescript: ['string', 'number', 'boolean', 'any', 'void', 'null', 'undefined', 'never', 'unknown', 'Array', 'Record', 'Promise', 'Map', 'Set', 'Date', 'Partial', 'Required', 'Pick', 'Omit', 'Exclude', 'Extract', 'NonNullable', 'ReturnType'],
  // Add more languages as needed
};

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, className, expanded: initialExpanded = false, inPost = false }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(initialExpanded || inPost);
  const [fileName, setFileName] = useState(`${language}.${getFileExtension(language)}`);
  const [highlightedCode, setHighlightedCode] = useState<React.ReactNode[]>([]);
  
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

  // Tokenize code for syntax highlighting
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

  // Set max height based on context - much larger for published posts
  const maxHeight = inPost ? 'max-h-screen' : expanded ? 'max-h-[80vh]' : 'max-h-[500px]';

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
      <ScrollArea className={cn(maxHeight, "overflow-x-auto")}>
        <div className="relative">
          <div className="flex text-sm font-mono">
            <div className="py-4 pl-4 pr-3 text-right select-none bg-[#1e1e1e] text-gray-500 border-r border-gray-700 min-w-[2.5rem]">
              {lineNumbers.map((num) => (
                <div key={num} className="leading-6 relative">
                  {num}
                </div>
              ))}
            </div>
            <div className="overflow-x-auto w-full relative">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {lineNumbers.map((num) => (
                  <div key={num} className="h-6 border-b border-gray-800/20"></div>
                ))}
              </div>
              <pre className="py-4 pl-4 pr-8 font-mono whitespace-pre relative z-10 overflow-visible w-max min-w-full">
                <code className="text-sm text-[#D4D4D4]">
                  {highlightedCode}
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
