
import React, { useState } from 'react';
import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, className }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
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

  return (
    <div className={cn(
      "my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900",
      className
    )}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{language}</div>
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
      <div className="relative">
        <pre className="overflow-x-auto p-4 text-sm">
          <code className="font-mono whitespace-pre">{displayedCode}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
