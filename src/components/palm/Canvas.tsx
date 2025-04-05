
import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Download, Pencil, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [tool, setTool] = useState<'pencil' | 'rectangle'>('pencil');
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  
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
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant={tool === 'pencil' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setTool('pencil')}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant={tool === 'rectangle' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setTool('rectangle')}
            className="h-8 w-8 p-0"
          >
            <Square className="h-4 w-4" />
          </Button>
          <input 
            type="color" 
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 p-0 cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearCanvas}
            className="h-8"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className="h-8"
          >
            <Download className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={600}
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
  );
};
