
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CodeEditorProps {
  onSave: (code: string, language: string) => void;
  onCancel: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ onSave, onCancel }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

  const handleSave = () => {
    onSave(code, language);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Add Code Snippet</h3>
        <Select
          value={language}
          onValueChange={setLanguage}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="typescript">TypeScript</SelectItem>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="java">Java</SelectItem>
            <SelectItem value="csharp">C#</SelectItem>
            <SelectItem value="cpp">C++</SelectItem>
            <SelectItem value="go">Go</SelectItem>
            <SelectItem value="rust">Rust</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="css">CSS</SelectItem>
            <SelectItem value="sql">SQL</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <textarea
        className="w-full min-h-[200px] p-3 border border-gray-300 dark:border-gray-700 rounded-md font-mono text-sm"
        value={code}
        onChange={handleChange}
        placeholder="// Enter your code here..."
      />
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default CodeEditor;
