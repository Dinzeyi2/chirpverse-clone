
import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Download, Pencil, Square, Undo, Redo, Type, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { cn } from '@/lib/utils';

type Tool = 'pencil' | 'rectangle' | 'text';

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [tool, setTool] = useState<Tool>('pencil');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isAddingText, setIsAddingText] = useState(false);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas to white background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save initial state
    const initialState = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialState]);
  }, []);
  
  // Focus text input when adding text
  useEffect(() => {
    if (isAddingText && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isAddingText]);
  
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const currentState = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev, currentState]);
    setRedoStack([]);
  };
  
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
    
    if (tool === 'text') {
      setIsAddingText(true);
      setTextInput('');
      if (textInputRef.current) {
        textInputRef.current.style.left = `${x}px`;
        textInputRef.current.style.top = `${y}px`;
      }
      return;
    }
    
    setIsDrawing(true);
    
    if (tool === 'pencil') {
      context.beginPath();
      context.moveTo(x, y);
      context.lineWidth = strokeWidth;
      context.strokeStyle = color;
      context.lineCap = 'round';
    }
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'text') return;
    
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
      tempContext.lineWidth = strokeWidth;
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
    if (!isDrawing && tool !== 'text') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    if (tool === 'pencil') {
      context.closePath();
    }
    
    saveToHistory();
    setIsDrawing(false);
  };
  
  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };
  
  const handleUndo = () => {
    if (history.length <= 1) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Pop the last action from history
    const newHistory = [...history];
    const lastState = newHistory.pop();
    if (!lastState) return;
    
    // Add to redo stack
    setRedoStack(prev => [...prev, lastState]);
    
    // Apply the previous state
    if (newHistory.length > 0) {
      const previousState = newHistory[newHistory.length - 1];
      context.putImageData(previousState, 0, 0);
    }
    
    setHistory(newHistory);
  };
  
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Pop the last action from redo stack
    const newRedoStack = [...redoStack];
    const stateToRestore = newRedoStack.pop();
    if (!stateToRestore) return;
    
    // Apply the state
    context.putImageData(stateToRestore, 0, 0);
    
    // Update history
    setHistory(prev => [...prev, stateToRestore]);
    setRedoStack(newRedoStack);
  };
  
  const handleAddText = () => {
    if (!textInput.trim() || !isAddingText) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.font = `${strokeWidth * 6}px Arial`;
    context.fillStyle = color;
    context.fillText(
      textInput, 
      startPosition.x, 
      startPosition.y + strokeWidth * 6
    );
    
    setIsAddingText(false);
    setTextInput('');
    saveToHistory();
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
  
  const colorOptions = [
    '#000000', // Black
    '#FF0000', // Red 
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
  ];
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
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
          <Button 
            variant={tool === 'text' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setTool('text')}
            className="h-8 w-8 p-0"
          >
            <Type className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <div 
                  className="h-4 w-4 rounded-full border border-gray-300" 
                  style={{ backgroundColor: color }}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="p-2 flex flex-wrap gap-1 w-[120px]">
              {colorOptions.map((c) => (
                <div
                  key={c}
                  className={cn(
                    "h-6 w-6 rounded-full cursor-pointer border border-gray-300",
                    color === c && "ring-2 ring-blue-500"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <input 
                type="color" 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-6 w-6 p-0 cursor-pointer"
              />
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="ml-2 w-24">
            <Slider 
              value={[strokeWidth]} 
              min={1} 
              max={10} 
              step={1} 
              onValueChange={(value) => setStrokeWidth(value[0])}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUndo}
            className="h-8 w-8 p-0"
            disabled={history.length <= 1}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRedo}
            className="h-8 w-8 p-0"
            disabled={redoStack.length === 0}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearCanvas}
            className="h-8 px-2"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className="h-8 px-2"
          >
            <Download className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
      
      <div className="relative border rounded-lg overflow-hidden bg-white shadow-md">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="w-full touch-none cursor-crosshair"
        />
        
        {isAddingText && (
          <div className="absolute inset-0 bg-black bg-opacity-10">
            <textarea
              ref={textInputRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="absolute p-1 border-2 border-blue-500 bg-white"
              style={{ 
                minWidth: '100px',
                minHeight: '30px',
                outline: 'none',
                fontSize: `${strokeWidth * 6}px`,
                color: color,
              }}
              onBlur={handleAddText}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddText();
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
