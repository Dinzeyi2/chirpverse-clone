
import React, { useState, useRef, useEffect } from 'react';
import { Check, Copy, ChevronDown, ChevronUp, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
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

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, className }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fileName, setFileName] = useState(`${language}.${getFileExtension(language)}`);
  const [highlightedCode, setHighlightedCode] = useState<React.ReactNode[]>([]);
  
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

  // Tokenize code for syntax highlighting
  useEffect(() => {
    const tokens = tokenizeCode(displayedCode, language);
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

  // Tokenize code for syntax highlighting
  const tokenizeCode = (input: string, lang: string): SyntaxToken[] => {
    const tokens: SyntaxToken[] = [];
    if (!input) return tokens;

    // Use the language-specific rules
    const keywords = LANGUAGE_KEYWORDS[lang] || LANGUAGE_KEYWORDS.javascript;
    const types = LANGUAGE_TYPES[lang] || LANGUAGE_TYPES.javascript;

    // Split the input by various delimiters while preserving them
    let currentToken = '';
    let inString = false;
    let stringDelimiter = '';
    let inComment = false;
    let inMultilineComment = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const nextChar = i < input.length - 1 ? input[i + 1] : '';

      // Handle comments
      if (!inString && !inComment && !inMultilineComment && char === '/' && nextChar === '/') {
        if (currentToken) {
          tokens.push({ text: currentToken, type: 'plain', color: '#D4D4D4' });
          currentToken = '';
        }
        inComment = true;
        currentToken += char;
        continue;
      }

      if (!inString && !inComment && !inMultilineComment && char === '/' && nextChar === '*') {
        if (currentToken) {
          tokens.push({ text: currentToken, type: 'plain', color: '#D4D4D4' });
          currentToken = '';
        }
        inMultilineComment = true;
        currentToken += char;
        continue;
      }

      if (inComment && (char === '\n' || i === input.length - 1)) {
        currentToken += char;
        tokens.push({ text: currentToken, type: 'comment', color: '#6A9955' });
        currentToken = '';
        inComment = false;
        continue;
      }

      if (inMultilineComment && char === '*' && nextChar === '/') {
        currentToken += char + nextChar;
        i++; // Skip next char
        tokens.push({ text: currentToken, type: 'comment', color: '#6A9955' });
        currentToken = '';
        inMultilineComment = false;
        continue;
      }

      if (inComment || inMultilineComment) {
        currentToken += char;
        continue;
      }

      // Handle strings
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        if (currentToken) {
          if (keywords.includes(currentToken)) {
            tokens.push({ text: currentToken, type: 'keyword', color: '#569CD6' });
          } else if (types.includes(currentToken)) {
            tokens.push({ text: currentToken, type: 'type', color: '#4EC9B0' });
          } else if (/^[0-9]+(\.[0-9]+)?$/.test(currentToken)) {
            tokens.push({ text: currentToken, type: 'number', color: '#B5CEA8' });
          } else if (currentToken === 'true' || currentToken === 'false') {
            tokens.push({ text: currentToken, type: 'boolean', color: '#569CD6' });
          } else if (/^[A-Z][A-Za-z0-9]*$/.test(currentToken)) {
            tokens.push({ text: currentToken, type: 'type', color: '#4EC9B0' });
          } else if (i < input.length - 1 && input[i + 1] === '(') {
            tokens.push({ text: currentToken, type: 'function', color: '#DCDCAA' });
          } else {
            tokens.push({ text: currentToken, type: 'variable', color: '#9CDCFE' });
          }
          currentToken = '';
        }
        inString = true;
        stringDelimiter = char;
        currentToken += char;
        continue;
      }

      if (inString && char === stringDelimiter && input[i - 1] !== '\\') {
        currentToken += char;
        tokens.push({ text: currentToken, type: 'string', color: '#CE9178' });
        currentToken = '';
        inString = false;
        continue;
      }

      if (inString) {
        currentToken += char;
        continue;
      }

      // Handle operators and punctuation
      if (/[+\-*/%=&|^~<>!?:;,.(){}[\]]/.test(char)) {
        if (currentToken) {
          if (keywords.includes(currentToken)) {
            tokens.push({ text: currentToken, type: 'keyword', color: '#569CD6' });
          } else if (currentToken === 'import' || currentToken === 'export' || currentToken === 'from' || currentToken === 'as') {
            tokens.push({ text: currentToken, type: 'keyword', color: '#C586C0' });
          } else if (types.includes(currentToken)) {
            tokens.push({ text: currentToken, type: 'type', color: '#4EC9B0' });
          } else if (/^[0-9]+(\.[0-9]+)?$/.test(currentToken)) {
            tokens.push({ text: currentToken, type: 'number', color: '#B5CEA8' });
          } else if (currentToken === 'true' || currentToken === 'false') {
            tokens.push({ text: currentToken, type: 'boolean', color: '#569CD6' });
          } else if (/^[A-Z][A-Za-z0-9]*$/.test(currentToken)) {
            tokens.push({ text: currentToken, type: 'type', color: '#4EC9B0' });
          } else if (i < input.length - 1 && input[i + 1] === '(') {
            tokens.push({ text: currentToken, type: 'function', color: '#DCDCAA' });
          } else {
            tokens.push({ text: currentToken, type: 'variable', color: '#9CDCFE' });
          }
          currentToken = '';
        }
        tokens.push({ text: char, type: 'punctuation', color: '#D4D4D4' });
        continue;
      }

      // Handle whitespace
      if (/\s/.test(char)) {
        if (currentToken) {
          if (keywords.includes(currentToken)) {
            tokens.push({ text: currentToken, type: 'keyword', color: '#569CD6' });
          } else if (currentToken === 'import' || currentToken === 'export' || currentToken === 'from' || currentToken === 'as') {
            tokens.push({ text: currentToken, type: 'keyword', color: '#C586C0' });
          } else if (types.includes(currentToken)) {
            tokens.push({ text: currentToken, type: 'type', color: '#4EC9B0' });
          } else if (/^[0-9]+(\.[0-9]+)?$/.test(currentToken)) {
            tokens.push({ text: currentToken, type: 'number', color: '#B5CEA8' });
          } else if (currentToken === 'true' || currentToken === 'false') {
            tokens.push({ text: currentToken, type: 'boolean', color: '#569CD6' });
          } else if (/^[A-Z][A-Za-z0-9]*$/.test(currentToken)) {
            tokens.push({ text: currentToken, type: 'type', color: '#4EC9B0' });
          } else if (i < input.length - 1 && input[i + 1] === '(') {
            tokens.push({ text: currentToken, type: 'function', color: '#DCDCAA' });
          } else {
            tokens.push({ text: currentToken, type: 'variable', color: '#9CDCFE' });
          }
          currentToken = '';
        }
        tokens.push({ text: char, type: 'plain', color: '#D4D4D4' });
        continue;
      }

      // Collect characters for next token
      currentToken += char;
    }

    // Don't forget the last token
    if (currentToken) {
      if (inComment || inMultilineComment) {
        tokens.push({ text: currentToken, type: 'comment', color: '#6A9955' });
      } else if (inString) {
        tokens.push({ text: currentToken, type: 'string', color: '#CE9178' });
      } else if (keywords.includes(currentToken)) {
        tokens.push({ text: currentToken, type: 'keyword', color: '#569CD6' });
      } else if (currentToken === 'import' || currentToken === 'export' || currentToken === 'from' || currentToken === 'as') {
        tokens.push({ text: currentToken, type: 'keyword', color: '#C586C0' });
      } else if (types.includes(currentToken)) {
        tokens.push({ text: currentToken, type: 'type', color: '#4EC9B0' });
      } else if (/^[0-9]+(\.[0-9]+)?$/.test(currentToken)) {
        tokens.push({ text: currentToken, type: 'number', color: '#B5CEA8' });
      } else if (currentToken === 'true' || currentToken === 'false') {
        tokens.push({ text: currentToken, type: 'boolean', color: '#569CD6' });
      } else if (/^[A-Z][A-Za-z0-9]*$/.test(currentToken)) {
        tokens.push({ text: currentToken, type: 'type', color: '#4EC9B0' });
      } else if (currentToken.startsWith('DEFAULT')) {
        tokens.push({ text: currentToken, type: 'variable', color: '#4FC1FF' });
      } else if (currentToken.startsWith('hsl')) {
        tokens.push({ text: currentToken, type: 'function', color: '#DCDCAA' });
      } else {
        tokens.push({ text: currentToken, type: 'variable', color: '#9CDCFE' });
      }
    }

    return tokens;
  };

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
      <ScrollArea className={expanded ? 'h-[80vh]' : 'max-h-[400px]'}>
        <div className="relative">
          <div className="flex text-sm font-mono">
            <div className="py-4 pl-4 pr-3 text-right select-none bg-[#1e1e1e] text-gray-500 border-r border-gray-700 min-w-[2.5rem]">
              {lineNumbers.map((num) => (
                <div key={num} className="leading-6">
                  {num}
                </div>
              ))}
            </div>
            <div className="overflow-x-auto w-full">
              <pre className="py-4 pl-4 pr-4 font-mono whitespace-pre">
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
