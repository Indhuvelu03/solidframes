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
                ? mode === 'dark' 
                    ? "bg-[#fbbf24] text-black shadow-lg scale-105 font-bold"
                    : "bg-[#fbbf24] text-black shadow-lg scale-105 font-bold"
                : mode === 'dark'
                    ? "hover:bg-white/10 text-gray-300"
                    : "hover:bg-gray-200 text-gray-700"
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
            const link = document.createElement('a');
            link.download = 'ultracad-export.png';
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    return (
        <header className={cn(
            "h-16 border-b flex items-center justify-between px-6 z-50",
            mode === 'dark' 
                ? "bg-[#0a0a0a] border-[#262626]" 
                : "bg-[#f4f4f5] border-[#e5e5e5]"
        )}>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        mode === 'dark' ? "bg-[#fbbf24]" : "bg-[#fbbf24]"
                    )}>
                        <span className="text-black font-bold text-xl">U</span>
                    </div>
                    <h1 className={cn(
                        "text-xl font-bold tracking-tight font-display",
                        mode === 'dark' ? "text-white" : "text-[#09090b]"
                    )}>
                        UltraCAD
                    </h1>
                </div>
                <div className={cn("h-6 w-px mx-2", mode === 'dark' ? "bg-white/10" : "bg-gray-300")} />
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
                <div className={cn("h-6 w-px mx-2", mode === 'dark' ? "bg-white/10" : "bg-gray-300")} />
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={useCadStore.getState().undo}
                        disabled={useCadStore((s: any) => s.undoStack.length <= 1)}
                        className={cn(
                            "p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed",
                            mode === 'dark' ? "text-gray-400 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
                        )}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={20} />
                    </button>
                    <button
                        onClick={useCadStore.getState().redo}
                        disabled={useCadStore((s: any) => s.redoStack.length === 0)}
                        className={cn(
                            "p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed",
                            mode === 'dark' ? "text-gray-400 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
                        )}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo size={20} />
                    </button>
                    <div className={cn("h-6 w-px mx-1", mode === 'dark' ? "bg-white/10" : "bg-gray-300")} />
                    <button
                        onClick={() => {
                            if (confirm('Clear entire canvas? This cannot be undone.')) {
                                useCadStore.getState().resetCanvas();
                            }
                        }}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            mode === 'dark' ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"
                        )}
                        title="Reset Canvas"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleExport}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-sm",
                        mode === 'dark'
                            ? "bg-[#fbbf24] hover:bg-[#f59e0b] text-black"
                            : "bg-[#fbbf24] hover:bg-[#f59e0b] text-black"
                    )}
                >
                    <Download size={18} />
                    Export PNG
                </button>
                <button
                    onClick={toggleMode}
                    className={cn(
                        "p-2 rounded-lg transition-colors",
                        mode === 'dark' ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"
                    )}
                >
                    {mode === 'dark' ? <Sun size={20} className="text-[#fbbf24]" /> : <Moon size={20} className="text-gray-600" />}
                </button>
            </div>
        </header>
    );
}
