
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Copy, SquareCode } from 'lucide-react';
import { toast } from 'sonner';

interface CodeDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  code: string;
  language?: string;
  onCodeChange?: (code: string) => void;
}

const CodeDialog: React.FC<CodeDialogProps> = ({
  open,
  onClose,
  title = 'Code Editor',
  code,
  language = 'html',
  onCodeChange
}) => {
  const [content, setContent] = useState(code);
  const editorRef = useRef<HTMLPreElement>(null);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);
  
  useEffect(() => {
    setContent(code);
  }, [code]);

  useEffect(() => {
    if (content) {
      const lines = content.split('\n').length;
      setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
    } else {
      setLineNumbers([1]);
    }
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Code copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] p-0 gap-0 h-[80vh] max-h-[80vh] overflow-hidden bg-[#1e1e1e] text-white border-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#252526]">
          <div className="flex items-center">
            <SquareCode className="mr-2 h-5 w-5 text-gray-400" />
            <DialogTitle className="text-sm font-medium text-gray-200">{title}</DialogTitle>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCopy}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>
        
        <div className="flex h-full overflow-hidden">
          {/* Line numbers */}
          <div className="bg-[#1e1e1e] border-r border-gray-800 px-2 py-2 text-right text-xs text-gray-500 select-none w-12 overflow-y-auto">
            {lineNumbers.map(num => (
              <div key={num} className="leading-5">{num}</div>
            ))}
          </div>
          
          {/* Code content */}
          <pre 
            ref={editorRef}
            className="flex-1 p-2 overflow-auto text-sm text-gray-300 font-mono whitespace-pre"
            style={{ 
              backgroundColor: '#1e1e1e', 
              tab: 2,
              WebkitFontSmoothing: 'antialiased'
            }}
          >
            <code className={`language-${language}`}>{content}</code>
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodeDialog;
