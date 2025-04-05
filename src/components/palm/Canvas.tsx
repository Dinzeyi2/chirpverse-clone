
import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [tool, setTool] = useState<'pencil' | 'rectangle'>('pencil');
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas to white background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);
  
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Get position
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    setStartPosition({ x, y });
    
    setIsDrawing(true);
    
    if (tool === 'pencil') {
      context.beginPath();
      context.moveTo(x, y);
      context.lineWidth = 2;
      context.strokeStyle = color;
      context.lineCap = 'round';
    }
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Get position
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (tool === 'pencil') {
      context.lineTo(x, y);
      context.stroke();
    } else if (tool === 'rectangle') {
      // Create temporary canvas for preview
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempContext = tempCanvas.getContext('2d');
      
      if (!tempContext) return;
      
      // Copy the original canvas
      tempContext.drawImage(canvas, 0, 0);
      
      // Draw rectangle
      tempContext.strokeStyle = color;
      tempContext.lineWidth = 2;
      tempContext.strokeRect(
        startPosition.x,
        startPosition.y,
        x - startPosition.x,
        y - startPosition.y
      );
      
      // Clear and redraw
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(tempCanvas, 0, 0);
    }
  };
  
  const endDrawing = () => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    if (tool === 'pencil') {
      context.closePath();
    }
    
    setIsDrawing(false);
  };
  
  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };
  
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create temporary link
    const link = document.createElement('a');
    link.download = 'palm-drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Would implement actual copy functionality in a real app
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#1e1e1e] text-white rounded-lg overflow-hidden">
        {/* Header bar similar to code editor */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
          <div className="flex items-center">
            <span className="text-xs mr-2">drawing.png</span>
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
        
        {/* Line numbers and drawing area */}
        <div className="flex">
          {/* Line numbers */}
          <div className="bg-[#1e1e1e] text-[#858585] text-xs px-2 py-1 select-none w-9 text-right">
            <div>1</div>
            <div>2</div>
            <div>3</div>
            <div>4</div>
            <div>5</div>
            <div>6</div>
            <div>7</div>
            <div>8</div>
          </div>
          
          {/* Drawing canvas with dark background */}
          <div className="flex-grow bg-[#1e1e1e] overflow-auto">
            <canvas
              ref={canvasRef}
              width={580}
              height={300}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={endDrawing}
              className="w-full touch-none cursor-crosshair"
            />
          </div>
        </div>
        
        {/* Footer with tools */}
        <div className="px-3 py-2 bg-[#252526] border-t border-[#3e3e42] flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <input 
              type="color" 
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-6 w-6 p-0 cursor-pointer bg-transparent border-none"
            />
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setTool('pencil')}
                className={`px-2 py-1 rounded text-xs ${tool === 'pencil' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:bg-[#3e3e42]'}`}
              >
                Pencil
              </button>
              <button
                onClick={() => setTool('rectangle')}
                className={`px-2 py-1 rounded text-xs ${tool === 'rectangle' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:bg-[#3e3e42]'}`}
              >
                Rectangle
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearCanvas}
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
              Save
            </Button>
          </div>
        </div>
      </div>
      
      {/* Code-like explanation */}
      <div className="text-sm">
        <h3 className="font-semibold mb-2">Key features:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><span className="font-medium">Drawing Tools:</span> Basic pencil and rectangle shape tools</li>
          <li><span className="font-medium">Color Selection:</span> Choose any color for your drawing</li>
          <li><span className="font-medium">Save Functionality:</span> Download your creation as a PNG image</li>
        </ul>
      </div>
    </div>
  );
};
