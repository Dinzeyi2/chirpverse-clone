
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [language, setLanguage] = useState('javascript');

  const handleSave = () => {
    onSave(code, language);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogTitle>Code Editor</DialogTitle>
        <DialogDescription>
          Add your code snippet below. Select the language for syntax highlighting.
        </DialogDescription>
        
        <div className="flex flex-col space-y-4 h-full">
          <div className="flex items-center space-x-2">
            <label htmlFor="language" className="text-sm font-medium">Language:</label>
            <Select
              value={language}
              onValueChange={setLanguage}
            >
              <SelectTrigger id="language" className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <ScrollArea className="border rounded-md flex-1 min-h-[300px]">
            <div className="p-0">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-[300px] font-mono text-sm p-4 bg-black/5 dark:bg-white/5 resize-none outline-none border-none"
                placeholder="// Write your code here..."
                spellCheck="false"
              />
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Insert Code</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CodeEditorDialog;
