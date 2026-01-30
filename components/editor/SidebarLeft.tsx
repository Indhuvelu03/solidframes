"use client";

import { Layers, TreePine, Eye, EyeOff, Lock, Unlock, Box } from "lucide-react";
import { useCadStore, CadLayer } from "@/store/useCadStore";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function SidebarLeft() {
    const activeLayer = useCadStore((state: any) => state.activeLayer);
    const setActiveLayer = useCadStore((state: any) => state.setActiveLayer);
    const layers = useCadStore((state: any) => state.layers);
    const toggleLayerVisibility = useCadStore((state: any) => state.toggleLayerVisibility);
    const projectTree = useCadStore((state: any) => state.projectTree);
    const selection = useCadStore((state: any) => state.selection);
    const setSelection = useCadStore((state: any) => state.setSelection);
    const mode = useCadStore((state: any) => state.mode);

    const layerList: CadLayer[] = ['Walls', 'Furniture', 'Electrical'];

    const handleTreeItemClick = (id: string) => {
        setSelection([id]);
        // Trigger generic selection update in editor if needed, 
        // though editor usually listens to store or dispatches events.
        // For now, setting store state is enough as Editor listens to it.
        window.dispatchEvent(new CustomEvent('cad-action', { detail: { type: 'select-by-id', id } }));
    };

    return (
        <aside className="w-72 border-r flex flex-col h-full z-40 bg-card border-border">
            {/* Layers Section */}
            <div className="p-4 flex flex-col gap-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Layers size={18} className="text-primary" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Layers</h2>
                </div>

                <div className="flex flex-col gap-2">
                    {layerList.map((layer) => (
                        <div
                            key={layer}
                            className={cn(
                                "flex items-center justify-between p-2 rounded-lg transition-colors group",
                                activeLayer === layer
                                    ? "bg-accent border border-primary/20 shadow-sm"
                                    : "hover:bg-accent/50 border border-transparent"
                            )}
                            onClick={() => setActiveLayer(layer)}
                        >
                            <div className="flex items-center gap-3 cursor-pointer">
                                <div className={cn(
                                    "w-1.5 h-6 rounded-full",
                                    layer === 'Walls' ? "bg-primary" :
                                        layer === 'Furniture' ? "bg-blue-500" : "bg-green-500"
                                )} />
                                <span className={cn(
                                    "text-sm font-medium transition-colors",
                                    activeLayer === layer
                                        ? "text-foreground font-semibold"
                                        : "text-muted-foreground"
                                )}>
                                    {layer}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer); }}
                                    className="p-1.5 rounded hover:bg-accent transition-colors"
                                >
                                    {layers[layer].visible ? <Eye size={14} /> : <EyeOff size={14} className="text-destructive" />}
                                </button>
                                <button className="p-1.5 rounded hover:bg-accent transition-colors">
                                    <Unlock size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Project Tree Section */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4 flex items-center gap-2">
                    <TreePine size={18} className="text-primary" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Project Tree</h2>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {projectTree.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Box size={40} className="mb-2 opacity-20 text-muted-foreground" />
                            <p className="text-xs font-medium text-muted-foreground">No objects drawn yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {projectTree.map((item: any) => {
                                const isSelected = selection.includes(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleTreeItemClick(item.id)}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs group transition-all",
                                            isSelected
                                                ? "bg-accent border border-primary/20 shadow-sm"
                                                : "hover:bg-accent/50 border border-transparent"
                                        )}
                                    >
                                        <Box size={14} className={cn(
                                            "transition-colors",
                                            isSelected ? "text-primary" : "text-muted-foreground"
                                        )} />
                                        <span className={cn(
                                            "truncate flex-1 font-medium",
                                            isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                                        )}>
                                            {item.name} <span className="text-[10px] opacity-40 ml-1">#{item.id.slice(-4)}</span>
                                        </span>
                                        <div className={cn(
                                            "transition-opacity",
                                            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                        )}>
                                            <Eye size={12} className="text-muted-foreground" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
