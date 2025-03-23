
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

  const handleTextareaScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

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
        
        <div className="flex flex-1 overflow-hidden">
          <div 
            ref={lineNumbersRef}
            className="w-[50px] bg-[#1e1e1e] text-right text-xs text-gray-500 select-none border-r border-gray-800 overflow-y-auto"
          >
            {lineNumbers.map(num => (
              <div key={num} className="pr-3 leading-6">{num}</div>
            ))}
          </div>
          
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleTextareaChange}
            onScroll={handleTextareaScroll}
            className="flex-1 w-full h-full min-h-[400px] max-h-[calc(90vh-120px)] font-mono text-sm p-2 bg-[#1e1e1e] resize-none outline-none border-none text-gray-300 overflow-auto"
            placeholder="// Write your code here..."
            spellCheck="false"
          />
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
