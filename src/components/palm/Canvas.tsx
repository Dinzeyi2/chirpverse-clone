
import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Canvas = () => {
  const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign Up</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f2f2f2;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .signup-container {
      background: #fff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      width: 400px;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 24px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    .submit-btn {
      width: 100%;
      padding: 12px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
    }
    .submit-btn:hover {
      background: #45a049;
    }
    .error {
      color: red;
      font-size: 14px;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="signup-container">
    <h1>Create an Account</h1>
    <form id="signup-form">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" required>
        <div class="error" id="username-error"></div>
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" required>
        <div class="error" id="email-error"></div>
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" required>
        <div class="error" id="password-error"></div>
      </div>
      <div class="form-group">
        <label for="confirm-password">Confirm Password</label>
        <input type="password" id="confirm-password" required>
        <div class="error" id="confirm-password-error"></div>
      </div>
      <button type="submit" class="submit-btn">Sign Up</button>
    </form>
  </div>

  <script>
    const form = document.getElementById('signup-form');
    
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // Clear previous errors
      document.querySelectorAll('.error').forEach(el => el.textContent = '');
      
      // Validate password match
      if(password !== confirmPassword) {
        document.getElementById('confirm-password-error').textContent = 'Passwords do not match';
        return;
      }
      
      // If validation passes, you would normally send this data to a server
      console.log('Form submitted with:', { username, email, password });
      
      // Show success message or redirect
      alert('Sign up successful!');
      form.reset();
    });
  </script>
</body>
</html>`);
  
  const [activeLineNumber, setActiveLineNumber] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Extract all lines for display
  const codeLines = htmlCode.split('\n');
  
  // Get syntax highlighting colors based on content
  const getHighlightedLine = (line: string, lineNumber: number) => {
    // Simple syntax highlighting
    return line
      // HTML tags
      .replace(/(&lt;[\/!]?[a-zA-Z0-9-]+)/g, '<span style="color: #ff79c6">$1</span>')
      .replace(/([\/]?&gt;)/g, '<span style="color: #ff79c6">$1</span>')
      // HTML attributes
      .replace(/([a-zA-Z-]+)=["']([^"']*)["']/g, '<span style="color: #ffb86c">$1</span>=<span style="color: #f1fa8c">"$2"</span>')
      // CSS properties
      .replace(/([a-zA-Z-]+):/g, '<span style="color: #8be9fd">$1</span>:')
      // CSS values
      .replace(/:([^;{]+)(;|})/g, ':<span style="color: #bd93f9">$1</span>$2')
      // Comments
      .replace(/(&lt;!--.*--&gt;)/g, '<span style="color: #6272a4">$1</span>')
      // Script tags content
      .replace(/(&lt;script&gt;)([\s\S]*?)(&lt;\/script&gt;)/g, '<span style="color: #ff79c6">$1</span><span style="color: #f8f8f2">$2</span><span style="color: #ff79c6">$3</span>');
  };
  
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };
  
  // Prepare code for display with line numbers - ensure ALL lines are displayed
  const displayCode = codeLines.map((line, index) => {
    const escapedLine = escapeHtml(line);
    const highlightedLine = getHighlightedLine(escapedLine, index + 1);
    
    return (
      <div 
        key={index} 
        className={`code-line flex ${activeLineNumber === index + 1 ? 'bg-[#44475a]' : 'hover:bg-[#2c2f3a]'}`}
        onClick={() => setActiveLineNumber(index + 1)}
      >
        <div className="line-number w-12 text-right pr-4 text-gray-500 select-none border-r border-gray-700">
          {index + 1}
        </div>
        <div 
          className="line-content pl-4 font-mono whitespace-pre"
          dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }} 
        />
      </div>
    );
  });
  
  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([htmlCode], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = 'signup.html';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleClearCode = () => {
    setHtmlCode('');
    setActiveLineNumber(null);
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#1e1e1e] text-white rounded-lg overflow-hidden border border-gray-700">
        {/* Header bar similar to code editor */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
          <div className="flex items-center">
            <span className="text-xs mr-2">html.html</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopy}
              className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#3e3e42]"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        
        {/* Code editor with line numbers - ensure it's scrollable for ALL content */}
        <div className="max-h-[500px] overflow-auto">
          {displayCode}
        </div>
        
        {/* Footer with tools */}
        <div className="px-3 py-2 bg-[#252526] border-t border-[#3e3e42] flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">HTML</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearCode}
              className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-[#3e3e42]"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDownload}
              className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-[#3e3e42]"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </div>
      
      {/* Code-like explanation */}
      <div className="text-sm">
        <h3 className="font-semibold mb-2">Key improvements:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><span className="font-medium">Client-side Validation:</span> Added basic JavaScript to check if passwords match before submission. This prevents unnecessary server requests. Remember, <span className="font-medium">server-side validation is essential</span> for security.</li>
          <li><span className="font-medium">Form Submission Handling:</span> The JavaScript now prevents the default form submission and logs the form data to the console. This demonstrates how you would capture the data to send to a server.</li>
          <li><span className="font-medium">Form Reset:</span> After a successful (simulated) signup, the form is reset.</li>
        </ul>
      </div>
    </div>
  );
};
