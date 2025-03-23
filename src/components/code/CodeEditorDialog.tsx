
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (code: string, language: string) => void;
}

interface SyntaxToken {
  text: string;
  type: 'keyword' | 'string' | 'number' | 'boolean' | 'comment' | 'punctuation' | 'operator' | 'variable' | 'function' | 'type' | 'regex' | 'plain';
  color: string;
}

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'plaintext', label: 'Plain Text' },
];

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

const CodeEditorDialog: React.FC<CodeEditorDialogProps> = ({
  open,
  onClose,
  onSave
}) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [fileName, setFileName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [selection, setSelection] = useState<{ start: number, end: number } | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [highlightedCode, setHighlightedCode] = useState<React.ReactNode[]>([]);

  const handleSave = () => {
    onSave(code, language);
    onClose();
  };

  const getFileExtension = (lang: string): string => {
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
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const defaultFileName = `file.${getFileExtension(lang)}`;
    if (!fileName) {
      setFileName(defaultFileName);
    } else {
      const nameWithoutExt = fileName.split('.')[0];
      setFileName(`${nameWithoutExt}.${getFileExtension(lang)}`);
    }
  };

  useEffect(() => {
    if (!fileName) {
      setFileName(`file.${getFileExtension(language)}`);
    }
  }, [fileName, language]);

  // Handle text area scrolling and sync line numbers
  const handleTextareaScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Handle cursor position and selection changes
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
      if (textareaRef.current.selectionStart !== textareaRef.current.selectionEnd) {
        setSelection({
          start: textareaRef.current.selectionStart,
          end: textareaRef.current.selectionEnd
        });
      } else {
        setSelection(null);
      }
    }
  };

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
      } else {
        tokens.push({ text: currentToken, type: 'variable', color: '#9CDCFE' });
      }
    }

    return tokens;
  };

  // Auto-close brackets and quotes
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;

    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;
    
    // Auto-close brackets and quotes
    if (e.key === '(' || e.key === '{' || e.key === '[' || e.key === '"' || e.key === "'" || e.key === '`') {
      // Check if we're in a position where auto-closing makes sense
      const charAfter = value.charAt(selectionStart);
      if (selectionStart === selectionEnd && (charAfter === '' || /\s|\)|\}|\]|,|;/.test(charAfter))) {
        e.preventDefault();
        
        let closingChar = '';
        switch (e.key) {
          case '(': closingChar = ')'; break;
          case '{': closingChar = '}'; break;
          case '[': closingChar = ']'; break;
          default: closingChar = e.key; break;
        }
        
        const newValue = value.substring(0, selectionStart) + e.key + closingChar + value.substring(selectionEnd);
        setCode(newValue);
        
        // Set cursor position between the brackets
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = selectionStart + 1;
            textareaRef.current.selectionEnd = selectionStart + 1;
          }
        }, 0);
      }
    }
    
    // Handle tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const indent = '  ';
      
      if (selectionStart === selectionEnd) {
        // Simple tab insertion
        const newValue = value.substring(0, selectionStart) + indent + value.substring(selectionEnd);
        setCode(newValue);
        
        // Set cursor position after indentation
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = selectionStart + indent.length;
            textareaRef.current.selectionEnd = selectionStart + indent.length;
          }
        }, 0);
      } else {
        // Multi-line indentation
        const startLine = value.substring(0, selectionStart).lastIndexOf('\n') + 1;
        const endLine = selectionEnd + value.substring(selectionEnd).indexOf('\n');
        if (endLine === -1) endLine = value.length;
        
        const selectedText = value.substring(startLine, endLine);
        const lines = selectedText.split('\n');
        
        if (!e.shiftKey) {
          // Add indentation
          const indentedLines = lines.map(line => indent + line);
          const newText = indentedLines.join('\n');
          
          const newValue = value.substring(0, startLine) + newText + value.substring(endLine);
          setCode(newValue);
          
          // Adjust selection
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = startLine;
              textareaRef.current.selectionEnd = startLine + newText.length;
            }
          }, 0);
        } else {
          // Remove indentation
          const unindentedLines = lines.map(line => line.startsWith(indent) ? line.substring(indent.length) : line);
          const newText = unindentedLines.join('\n');
          
          const newValue = value.substring(0, startLine) + newText + value.substring(endLine);
          setCode(newValue);
          
          // Adjust selection
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = startLine;
              textareaRef.current.selectionEnd = startLine + newText.length;
            }
          }, 0);
        }
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

  // Render code with syntax highlighting
  useEffect(() => {
    const tokens = tokenizeCode(code, language);
    const highlighted = tokens.map((token, i) => (
      <span key={i} style={{ color: token.color }}>
        {token.text}
      </span>
    ));
    setHighlightedCode(highlighted);
  }, [code, language]);

  const lineNumbers = code.split('\n').map((_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-[#1e1e1e] text-white border-gray-800">
        <DialogTitle className="sr-only">Code Editor</DialogTitle>
        <DialogDescription className="sr-only">Edit your code snippet</DialogDescription>
        
        <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-800">
          <div className="flex items-center text-sm text-gray-300">
            <FileCode size={16} className="mr-2 text-gray-400" />
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="font-medium bg-transparent border-none outline-none"
              placeholder="Untitled.ts"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={language}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger id="language" className="w-[140px] h-8 text-xs bg-[#3c3c3c] border-gray-700">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-[#252526] border-gray-700 text-gray-300">
                {LANGUAGE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-xs hover:bg-[#2a2d2e]">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden relative">
          <div 
            ref={lineNumbersRef}
            className="w-[50px] bg-[#1e1e1e] text-right text-xs text-gray-500 select-none border-r border-gray-800 overflow-hidden"
          >
            <div className="h-full overflow-y-hidden">
              {lineNumbers.map(num => (
                <div key={num} className="pr-3 leading-6">{num}</div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden">
            <ScrollArea className="h-full max-h-[calc(90vh-120px)] relative">
              <div className="relative">
                {/* Hidden textarea for actual editing */}
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={handleTextareaChange}
                  onScroll={handleTextareaScroll}
                  onSelect={handleSelectionChange}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  className="absolute top-0 left-0 w-full h-full font-mono text-sm p-2 bg-transparent text-transparent caret-white resize-none outline-none border-none overflow-auto z-10"
                  placeholder="// Write your code here..."
                  spellCheck="false"
                  style={{ caretColor: 'white' }}
                />
                
                {/* Styled div for showing highlighted code */}
                <pre className="font-mono text-sm p-2 text-gray-300 whitespace-pre-wrap break-all min-h-[400px]">
                  {highlightedCode.length > 0 ? highlightedCode : <span className="text-gray-500">// Write your code here...</span>}
                </pre>
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex items-center justify-end px-4 py-2 bg-[#252526] border-t border-gray-800 gap-2">
          <Button variant="outline" onClick={onClose} className="h-8 text-xs bg-[#3c3c3c] border-gray-700 text-gray-300 hover:bg-[#4c4c4c]">
            Cancel
          </Button>
          <Button onClick={handleSave} className="h-8 text-xs bg-[#007acc] hover:bg-[#0069ac] text-white border-none">
            Insert Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodeEditorDialog;

