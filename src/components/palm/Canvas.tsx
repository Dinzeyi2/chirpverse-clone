
import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { 
  Trash2, Download, Move, Pencil, Square, Circle as CircleIcon, 
  Type, Undo, Redo, ChevronDown, Image as ImageIcon, 
  ArrowUp, RotateCw, Minus, Plus, BringToFront, SendToBack,
  ArrowRight, Triangle, MousePointer, FolderPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type Tool = 'select' | 'move' | 'pen' | 'pencil' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'text';

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [color, setColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('rgba(0,0,0,0)');
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [objectsCounter, setObjectsCounter] = useState(0);
  
  // Initialize canvas with Fabric.js
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
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
    
    // Cleanup
    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:modified', handleObjectModified);
      canvas.dispose();
    };
  }, []);
  
  // Update freeDrawingBrush when tool or color changes
  useEffect(() => {
    if (!fabricCanvas) return;
    
    fabricCanvas.isDrawingMode = tool === 'pencil' || tool === 'pen';
    fabricCanvas.freeDrawingBrush.color = color;
    fabricCanvas.freeDrawingBrush.width = strokeWidth;
    
    // Update cursor based on selected tool
    switch (tool) {
      case 'select':
        fabricCanvas.defaultCursor = 'default';
        break;
      case 'move':
        fabricCanvas.defaultCursor = 'move';
        break;
      case 'pencil':
      case 'pen':
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
    if (!fabricCanvas || tool === 'select' || tool === 'move' || tool === 'pencil' || tool === 'pen') return;
    
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
      case 'line':
        createLine(pointer);
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
    
    // If we're in drawing mode, we don't need to do anything here
    // Fabric.js handles the drawing internally
  };
  
  const handleMouseUp = () => {
    setIsDrawing(false);
    setObjectsCounter(prev => prev + 1);
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
  
  const createLine = (pointer: { x: number, y: number }) => {
    if (!fabricCanvas) return;
    
    const line = new fabric.Line([pointer.x, pointer.y, pointer.x + 100, pointer.y], {
      stroke: color,
      strokeWidth: strokeWidth,
      cornerSize: 8,
      transparentCorners: false,
    });
    
    fabricCanvas.add(line);
    fabricCanvas.setActiveObject(line);
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
    
    const text = new fabric.IText('Double click to edit', {
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
  
  const handleBringToFront = () => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) return;
    
    activeObject.bringToFront();
    fabricCanvas.renderAll();
    saveCanvasState();
  };
  
  const handleSendToBack = () => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) return;
    
    activeObject.sendToBack();
    fabricCanvas.renderAll();
    saveCanvasState();
  };
  
  const handleZoom = (zoomDir: 'in' | 'out') => {
    if (!fabricCanvas) return;
    
    let zoom = fabricCanvas.getZoom();
    
    if (zoomDir === 'in') {
      zoom = Math.min(zoom + 0.1, 3);
    } else {
      zoom = Math.max(zoom - 0.1, 0.5);
    }
    
    fabricCanvas.setZoom(zoom);
    setZoomLevel(Math.round(zoom * 100));
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
  
  // Define color palette
  const colorOptions = [
    '#000000', // Black
    '#ffffff', // White
    '#FF0000', // Red 
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#964B00', // Brown
    '#808080', // Gray
    '#A020F0', // Purple
  ];
  
  // UI Rendering
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col space-y-4">
        {/* Main Toolbar */}
        <div className="flex justify-between p-1 bg-gray-50 dark:bg-gray-900 rounded-md shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={tool === 'select' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTool('select')}
                    className="h-8 w-8 p-0"
                  >
                    <MousePointer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={tool === 'move' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTool('move')}
                    className="h-8 w-8 p-0"
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Move</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={tool === 'pencil' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTool('pencil')}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pencil</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={tool === 'rectangle' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTool('rectangle')}
                    className="h-8 w-8 p-0"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rectangle</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={tool === 'circle' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTool('circle')}
                    className="h-8 w-8 p-0"
                  >
                    <CircleIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Circle</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={tool === 'triangle' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTool('triangle')}
                    className="h-8 w-8 p-0"
                  >
                    <Triangle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Triangle</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={tool === 'line' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTool('line')}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Line</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={tool === 'arrow' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTool('arrow')}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Arrow</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={tool === 'text' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTool('text')}
                    className="h-8 w-8 p-0"
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Text</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Image Upload */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0 relative"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <ImageIcon className="h-4 w-4" />
                    <input 
                      type="file" 
                      id="image-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleUploadImage}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload Image</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Color Picker */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <div 
                          className="h-4 w-4 rounded-full border border-gray-300" 
                          style={{ backgroundColor: color }}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Stroke Color</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" className="p-2 w-[140px]">
                <div className="grid grid-cols-4 gap-1">
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
                </div>
                <div className="mt-2 flex justify-center">
                  <input 
                    type="color" 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-8 w-full cursor-pointer"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Fill Color Picker */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <div 
                          className="h-4 w-4 rounded-full border border-gray-300" 
                          style={{ 
                            backgroundColor: fillColor,
                            backgroundImage: fillColor === 'rgba(0,0,0,0)' ? 
                              'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 
                              'none',
                            backgroundSize: '6px 6px',
                            backgroundPosition: '0 0, 3px 3px'
                          }}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fill Color</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" className="p-2 w-[140px]">
                <div className="grid grid-cols-4 gap-1">
                  {['rgba(0,0,0,0)', ...colorOptions].map((c) => (
                    <div
                      key={c}
                      className={cn(
                        "h-6 w-6 rounded-full cursor-pointer border border-gray-300",
                        fillColor === c && "ring-2 ring-blue-500"
                      )}
                      style={{ 
                        backgroundColor: c,
                        backgroundImage: c === 'rgba(0,0,0,0)' ? 
                          'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 
                          'none',
                        backgroundSize: '6px 6px',
                        backgroundPosition: '0 0, 3px 3px'
                      }}
                      onClick={() => setFillColor(c)}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-center">
                  <input 
                    type="color" 
                    value={fillColor === 'rgba(0,0,0,0)' ? '#ffffff' : fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="h-8 w-full cursor-pointer"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Stroke Width Slider */}
            <div className="mx-1 flex items-center gap-2">
              <Slider 
                value={[strokeWidth]} 
                min={1} 
                max={20} 
                step={1} 
                onValueChange={(value) => setStrokeWidth(value[0])}
                className="w-24"
              />
              <span className="text-xs w-5">{strokeWidth}</span>
            </div>
            
            {/* Object Actions */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBringToFront}
                    className="h-8 w-8 p-0"
                  >
                    <BringToFront className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bring to Front</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSendToBack}
                    className="h-8 w-8 p-0"
                  >
                    <SendToBack className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send to Back</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Secondary Toolbar */}
        <div className="flex justify-between p-1 bg-gray-50 dark:bg-gray-900 rounded-md shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUndo}
                    className="h-8 px-2"
                    disabled={historyIndex <= 0}
                  >
                    <Undo className="h-4 w-4 mr-1" />
                    Undo
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRedo}
                    className="h-8 px-2"
                    disabled={historyIndex >= canvasHistory.length - 1}
                  >
                    <Redo className="h-4 w-4 mr-1" />
                    Redo
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDeleteSelected}
                    className="h-8 px-2"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Selected</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 mr-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleZoom('out')}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom Out</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <span className="text-xs w-12 text-center">{zoomLevel}%</span>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleZoom('in')}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom In</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearCanvas}
                    className="h-8 px-2"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear Canvas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload}
                    className="h-8 px-2"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export as PNG</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* Canvas Area */}
      <div className="relative flex-grow overflow-auto bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner">
        <div className="absolute inset-0 flex items-center justify-center p-4 overflow-auto">
          <div className="relative bg-white shadow-lg">
            <canvas
              ref={canvasRef}
              className="cursor-crosshair touch-none"
            />
            {/* Indicator for canvas size */}
            <div className="absolute bottom-2 right-2 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs opacity-70">
              800 × 600
            </div>
          </div>
        </div>
      </div>
      
      {/* Status bar */}
      <div className="flex justify-between text-xs text-gray-500 px-1">
        <div>
          Objects: {objectsCounter}
        </div>
        <div>
          Tool: {tool.charAt(0).toUpperCase() + tool.slice(1)}
        </div>
      </div>
    </div>
  );
};
