"use client";

import {
    MousePointer2,
    Minus,
    Square,
    Circle,
    Hexagon,
    Eraser,
    Type,
    Download,
    Moon,
    Sun,
    Ruler,
    Compass,
    Undo,
    Redo,
    RotateCcw
} from "lucide-react";
import { useCadStore, CadTool } from "@/store/useCadStore";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const ToolButton = ({
    tool,
    active,
    onClick,
    icon: Icon,
    label,
    mode
}: {
    tool: CadTool,
    active: boolean,
    onClick: () => void,
    icon: any,
    label: string,
    mode: string
}) => (
    <button
        onClick={onClick}
        title={label}
        className={cn(
            "p-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2",
            active
                ? "bg-primary text-primary-foreground shadow-md"
                : mode === 'dark'
                    ? "hover:bg-accent text-muted-foreground hover:text-foreground"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
        )}
    >
        <Icon size={20} />
    </button>
);

export default function Header() {
    const tool = useCadStore((state: any) => state.tool);
    const setTool = useCadStore((state: any) => state.setTool);
    const mode = useCadStore((state: any) => state.mode);
    const toggleMode = useCadStore((state: any) => state.toggleMode);

    const tools: { id: CadTool; icon: any; label: string }[] = [
        { id: 'select', icon: MousePointer2, label: 'Select (V)' },
        { id: 'line', icon: Minus, label: 'Line (L)' },
        { id: 'rect', icon: Square, label: 'Rectangle (R)' },
        { id: 'circle', icon: Circle, label: 'Circle (C)' },
        { id: 'poly', icon: Hexagon, label: 'Polygon (P)' },
        { id: 'text', icon: Type, label: 'Text (T)' },
        { id: 'eraser', icon: Eraser, label: 'Eraser (E)' },
        // { id: 'measure', icon: Ruler, label: 'Measure (M)' },
        // { id: 'angle', icon: Compass, label: 'Angle (A)' },
    ];

    const handleExport = () => {
        const { projectTree } = useCadStore.getState();

        if (projectTree.length === 0) {
            alert("Please draw something before exporting!");
            return;
        }

        const canvas = document.getElementById('cad-canvas') as HTMLCanvasElement;
        if (canvas) {
            // Create a temporary canvas with white background
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            
            // Fill with white background
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                // Draw the original canvas on top
                ctx.drawImage(canvas, 0, 0);
            }
            
            const link = document.createElement('a');
            link.download = 'ultracad-export.png';
            link.href = tempCanvas.toDataURL();
            link.click();
        }
    };

    return (
        <header className={cn(
            "h-16 border-b flex items-center justify-between px-6 z-50 bg-card",
            "border-border"
        )}>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
                        <span className="text-primary-foreground font-bold text-xl">U</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight font-display text-foreground">
                        UltraCAD
                    </h1>
                </div>
                <div className="h-6 w-px mx-2 bg-border" />
                <nav className="flex items-center gap-1.5">
                    {tools.map((t) => (
                        <ToolButton
                            key={t.id}
                            tool={t.id}
                            label={t.label}
                            icon={t.icon}
                            active={tool === t.id}
                            onClick={() => setTool(t.id)}
                            mode={mode}
                        />
                    ))}
                </nav>
                <div className="h-6 w-px mx-2 bg-border" />
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={useCadStore.getState().undo}
                        disabled={useCadStore((s: any) => s.undoStack.length <= 1)}
                        className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={20} />
                    </button>
                    <button
                        onClick={useCadStore.getState().redo}
                        disabled={useCadStore((s: any) => s.redoStack.length === 0)}
                        className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo size={20} />
                    </button>
                    <div className="h-6 w-px mx-1 bg-border" />
                    <button
                        onClick={() => {
                            if (confirm('Clear entire canvas? This cannot be undone.')) {
                                useCadStore.getState().resetCanvas();
                            }
                        }}
                        className="p-2 rounded-lg transition-colors text-destructive hover:bg-destructive/10"
                        title="Reset Canvas"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-semibold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <Download size={18} />
                    Export PNG
                </button>
                <button
                    onClick={toggleMode}
                    className="p-2 rounded-lg transition-colors hover:bg-accent"
                >
                    {mode === 'dark' ? <Sun size={20} className="text-foreground" /> : <Moon size={20} className="text-foreground" />}
                </button>
            </div>
        </header>
    );
}
