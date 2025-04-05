
import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { 
  Trash2, Download, MousePointer, Pencil, Square, Circle as CircleIcon, 
  Type, ImageIcon, ChevronDown, Undo, Redo,
  Triangle as TriangleIcon, ArrowRight, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tool = 'select' | 'draw' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'text' | 'image';

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('rgba(0,0,0,0)');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Initialize canvas with Fabric.js
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth > 800 ? 800 : window.innerWidth - 40,
      height: 600,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });
    
    setFabricCanvas(canvas);
    
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = strokeWidth;
    
    // Save initial state
    const initialState = JSON.stringify(canvas.toJSON());
    setCanvasHistory([initialState]);
    setHistoryIndex(0);
    
    // Handle canvas events
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:modified', handleObjectModified);
    
    // Resize handler
    const handleResize = () => {
      if (window.innerWidth > 800) {
        canvas.setWidth(800);
      } else {
        canvas.setWidth(window.innerWidth - 40);
      }
      canvas.renderAll();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:modified', handleObjectModified);
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);
  
  // Update freeDrawingBrush when tool or color changes
  useEffect(() => {
    if (!fabricCanvas) return;
    
    fabricCanvas.isDrawingMode = tool === 'draw';
    fabricCanvas.freeDrawingBrush.color = color;
    fabricCanvas.freeDrawingBrush.width = strokeWidth;
    
    // Update cursor based on selected tool
    switch (tool) {
      case 'select':
        fabricCanvas.defaultCursor = 'default';
        break;
      case 'draw':
        fabricCanvas.defaultCursor = 'crosshair';
        break;
      default:
        fabricCanvas.defaultCursor = 'crosshair';
    }
  }, [tool, color, strokeWidth, fabricCanvas]);
  
  // Track object modifications and additions for history
  const handleObjectAdded = () => {
    if (!fabricCanvas) return;
    saveCanvasState();
  };
  
  const handleObjectModified = () => {
    if (!fabricCanvas) return;
    saveCanvasState();
  };
  
  // Save current canvas state to history
  const saveCanvasState = () => {
    if (!fabricCanvas) return;
    
    const newState = JSON.stringify(fabricCanvas.toJSON());
    
    // Truncate future states if we're not at the end of history
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history to prevent memory issues
    if (newHistory.length > 30) {
      newHistory.shift();
    }
    
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // Handle undo and redo
  const handleUndo = () => {
    if (historyIndex <= 0 || !fabricCanvas) return;
    
    const newIndex = historyIndex - 1;
    const prevState = canvasHistory[newIndex];
    
    fabricCanvas.loadFromJSON(prevState, () => {
      fabricCanvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };
  
  const handleRedo = () => {
    if (historyIndex >= canvasHistory.length - 1 || !fabricCanvas) return;
    
    const newIndex = historyIndex + 1;
    const nextState = canvasHistory[newIndex];
    
    fabricCanvas.loadFromJSON(nextState, () => {
      fabricCanvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };
  
  // Drawing and object creation handlers
  const handleMouseDown = (e: fabric.IEvent<MouseEvent>) => {
    if (!fabricCanvas || tool === 'select' || tool === 'draw') return;
    
    setIsDrawing(true);
    const pointer = fabricCanvas.getPointer(e.e);
    
    switch (tool) {
      case 'rectangle':
        createRectangle(pointer);
        break;
      case 'circle':
        createCircle(pointer);
        break;
      case 'triangle':
        createTriangle(pointer);
        break;
      case 'arrow':
        createArrow(pointer);
        break;
      case 'text':
        createText(pointer);
        break;
    }
  };
  
  const handleMouseMove = (e: fabric.IEvent<MouseEvent>) => {
    if (!isDrawing || !fabricCanvas) return;
    // Fabric.js handles the drawing internally
  };
  
  const handleMouseUp = () => {
    setIsDrawing(false);
  };
  
  // Object creation methods
  const createRectangle = (pointer: { x: number, y: number }) => {
    if (!fabricCanvas) return;
    
    const rect = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      width: 100,
      height: 80,
      fill: fillColor,
      stroke: color,
      strokeWidth: strokeWidth,
      cornerSize: 8,
      transparentCorners: false,
    });
    
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
  };
  
  const createCircle = (pointer: { x: number, y: number }) => {
    if (!fabricCanvas) return;
    
    const circle = new fabric.Circle({
      left: pointer.x,
      top: pointer.y,
      radius: 50,
      fill: fillColor,
      stroke: color,
      strokeWidth: strokeWidth,
      cornerSize: 8,
      transparentCorners: false,
    });
    
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
  };
  
  const createTriangle = (pointer: { x: number, y: number }) => {
    if (!fabricCanvas) return;
    
    const triangle = new fabric.Triangle({
      left: pointer.x,
      top: pointer.y,
      width: 100,
      height: 100,
      fill: fillColor,
      stroke: color,
      strokeWidth: strokeWidth,
      cornerSize: 8,
      transparentCorners: false,
    });
    
    fabricCanvas.add(triangle);
    fabricCanvas.setActiveObject(triangle);
  };
  
  const createArrow = (pointer: { x: number, y: number }) => {
    if (!fabricCanvas) return;
    
    // Create line
    const line = new fabric.Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
      stroke: color,
      strokeWidth: strokeWidth,
    });
    
    // Create arrowhead
    const triangle = new fabric.Triangle({
      left: pointer.x + 100,
      top: pointer.y,
      width: 20,
      height: 20,
      fill: color,
      stroke: color,
      strokeWidth: 1,
      angle: 90,
      originX: 'center',
      originY: 'bottom',
    });
    
    // Group them together
    const arrow = new fabric.Group([line, triangle], {
      cornerSize: 8,
      transparentCorners: false,
    });
    
    fabricCanvas.add(arrow);
    fabricCanvas.setActiveObject(arrow);
  };
  
  const createText = (pointer: { x: number, y: number }) => {
    if (!fabricCanvas) return;
    
    const text = new fabric.IText('Edit text', {
      left: pointer.x,
      top: pointer.y,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: color,
      cornerSize: 8,
      transparentCorners: false,
      editable: true,
    });
    
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
  };
  
  // Canvas utility functions
  const handleClearCanvas = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    fabricCanvas.setBackgroundColor('#ffffff', () => {
      fabricCanvas.renderAll();
    });
    
    saveCanvasState();
    toast.success('Canvas cleared');
  };
  
  const handleDeleteSelected = () => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.remove(activeObject);
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      saveCanvasState();
    }
  };
  
  const handleDownload = () => {
    if (!fabricCanvas) return;
    
    const link = document.createElement('a');
    link.download = 'canvas-drawing.png';
    
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    
    link.href = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
    });
    
    link.click();
    toast.success('Image downloaded');
  };
  
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fabricCanvas || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result) return;
      
      fabric.Image.fromURL(event.target.result.toString(), (img) => {
        // Scale down large images
        if (img.width && img.width > 400) {
          const aspectRatio = img.width / (img.height || 1);
          img.scaleToWidth(400);
          img.scaleToHeight(400 / aspectRatio);
        }
        
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.renderAll();
        saveCanvasState();
      });
    };
    
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };
  
  // Define simple color palette - ChatGPT style
  const colorOptions = [
    '#000000', // Black
    '#5436DA', // ChatGPT purple
    '#FF0000', // Red
    '#00A67E', // Green/teal
    '#0000FF', // Blue
    '#FF8C00', // Orange
    '#AAAAAA', // Gray
  ];
  
  return (
    <div className="flex flex-col h-full">
      {/* ChatGPT-style Toolbar - Minimalist design */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-1">
          {/* Select tool */}
          <Button
            variant={tool === 'select' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2 rounded"
            onClick={() => setTool('select')}
          >
            <MousePointer className="h-4 w-4 mr-1" />
            <span className="text-xs">Select</span>
          </Button>
          
          {/* Draw tool */}
          <Button
            variant={tool === 'draw' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2 rounded"
            onClick={() => setTool('draw')}
          >
            <Pencil className="h-4 w-4 mr-1" />
            <span className="text-xs">Draw</span>
          </Button>
          
          {/* Shape dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 rounded"
              >
                <Square className="h-4 w-4 mr-1" />
                <span className="text-xs">Shape</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[120px]">
              <DropdownMenuItem onClick={() => setTool('rectangle')} className="flex items-center">
                <Square className="h-4 w-4 mr-2" />
                <span>Rectangle</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTool('circle')} className="flex items-center">
                <CircleIcon className="h-4 w-4 mr-2" />
                <span>Circle</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTool('triangle')} className="flex items-center">
                <TriangleIcon className="h-4 w-4 mr-2" />
                <span>Triangle</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTool('arrow')} className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2" />
                <span>Arrow</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Text tool */}
          <Button
            variant={tool === 'text' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2 rounded"
            onClick={() => setTool('text')}
          >
            <Type className="h-4 w-4 mr-1" />
            <span className="text-xs">Text</span>
          </Button>
          
          {/* Image upload */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 rounded relative"
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            <span className="text-xs">Image</span>
            <input 
              type="file" 
              id="image-upload" 
              accept="image/*" 
              className="hidden" 
              onChange={handleUploadImage}
            />
          </Button>
          
          {/* Delete and download options */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 rounded"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span className="text-xs">Delete</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded"
            onClick={handleRedo}
            disabled={historyIndex >= canvasHistory.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
          
          {/* Clear canvas */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 rounded"
            onClick={handleClearCanvas}
          >
            <X className="h-4 w-4 mr-1" />
            <span className="text-xs">Clear</span>
          </Button>
          
          {/* Download */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 rounded"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="text-xs">Export</span>
          </Button>
        </div>
      </div>
      
      {/* Color selector in ChatGPT style */}
      <div className="flex items-center space-x-2 px-3 py-1 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-1 mr-2">
          {colorOptions.map((c) => (
            <button
              key={c}
              className={cn(
                "h-6 w-6 rounded-full border",
                color === c && "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
              )}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        
        {/* Width options */}
        <div className="flex items-center space-x-1">
          <button
            className={cn(
              "h-6 w-6 rounded flex items-center justify-center",
              strokeWidth === 1 && "bg-gray-100 dark:bg-gray-800"
            )}
            onClick={() => setStrokeWidth(1)}
          >
            <div className="h-[1px] w-3 bg-current" />
          </button>
          
          <button
            className={cn(
              "h-6 w-6 rounded flex items-center justify-center",
              strokeWidth === 2 && "bg-gray-100 dark:bg-gray-800"
            )}
            onClick={() => setStrokeWidth(2)}
          >
            <div className="h-[2px] w-3 bg-current" />
          </button>
          
          <button
            className={cn(
              "h-6 w-6 rounded flex items-center justify-center",
              strokeWidth === 4 && "bg-gray-100 dark:bg-gray-800"
            )}
            onClick={() => setStrokeWidth(4)}
          >
            <div className="h-[4px] w-3 bg-current" />
          </button>
        </div>
        
        {/* Fill color */}
        <div className="flex items-center space-x-1 border-l border-gray-200 dark:border-gray-700 pl-2 ml-2">
          <button
            className={cn(
              "h-6 w-6 rounded flex items-center justify-center border border-gray-300 dark:border-gray-600",
              fillColor === 'rgba(0,0,0,0)' && "bg-gray-100 dark:bg-gray-800"
            )}
            onClick={() => setFillColor('rgba(0,0,0,0)')}
          >
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <X className="h-3 w-3 text-gray-500" />
              </div>
            </div>
          </button>
          
          {colorOptions.map((c) => (
            <button
              key={`fill-${c}`}
              className={cn(
                "h-6 w-6 rounded-full border border-gray-300 dark:border-gray-600",
                fillColor === c && "ring-2 ring-blue-500"
              )}
              style={{ backgroundColor: c }}
              onClick={() => setFillColor(c)}
            />
          ))}
        </div>
      </div>
      
      {/* Canvas Area - Clean minimal design */}
      <div className="flex-grow relative overflow-auto bg-gray-50 dark:bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white shadow-sm border border-gray-200 dark:border-gray-800 dark:bg-white">
            <canvas ref={canvasRef} className="touch-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
