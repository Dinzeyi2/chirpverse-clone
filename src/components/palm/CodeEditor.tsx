
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

type CodeEditorProps = {
  content: string;
};

const CodeEditor: React.FC<CodeEditorProps> = ({ content }) => {
  const [lines, setLines] = useState<string[]>(content ? content.split('\n') : ['']);
  
  // Generate line numbers for the visible content
  const lineNumbers = lines.map((_, i) => i + 1);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-2 flex items-center">
        <span className="text-sm text-blue-500 font-medium">Code</span>
      </div>
      
      <ScrollArea className="flex-1 overflow-auto">
        <div className="flex">
          {/* Line numbers */}
          <div className="pl-2 pr-3 text-right text-xs text-gray-500 select-none border-r border-gray-200 bg-gray-50 w-12">
            {lineNumbers.map(num => (
              <div key={num} className="h-6 leading-6">{num}</div>
            ))}
          </div>
          
          {/* Code content */}
          <div className="flex-1 pl-4 pr-4">
            <pre className="text-sm font-mono">
              <code className="language-typescript">
                {content || "// Code will appear here"}
              </code>
            </pre>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default CodeEditor;
