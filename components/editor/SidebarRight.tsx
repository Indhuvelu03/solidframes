"use client";

import {
    Settings2,
    RotateCw,
    Maximize2,
    Trash2,
    Magnet,
    Hash,
    Scale
} from "lucide-react";
import { useCadStore } from "@/store/useCadStore";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useEffect } from "react";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function SidebarRight() {
    const selection = useCadStore((state: any) => state.selection);
    const smartSnapping = useCadStore((state: any) => state.smartSnapping);
    const setSmartSnapping = useCadStore((state: any) => state.setSmartSnapping);
    const radioAngle = useCadStore((state: any) => state.radioAngle);
    const setRadioAngle = useCadStore((state: any) => state.setRadioAngle);
    const measuringScale = useCadStore((state: any) => state.measuringScale);
    const setMeasuringScale = useCadStore((state: any) => state.setMeasuringScale);
    const purge = useCadStore((state: any) => state.purge);
    const mode = useCadStore((state: any) => state.mode);

    const [propValues, setPropValues] = useState({
        width: "0",
        height: "0",
        rotation: "0",
        text: ""
    });

    const inputClass = "border rounded-md p-2 text-sm outline-none w-full transition-colors bg-background border-input focus:border-ring focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground";

    // Listen for selection updates from Editor
    useEffect(() => {
        const handleSelectionUpdate = (e: any) => {
            const { width, height, rotation, content } = e.detail;
            setPropValues({
                width: width ? Math.round(width).toString() : "0",
                height: height ? Math.round(height).toString() : "0",
                rotation: rotation ? Math.round(rotation).toString() : "0",
                text: content || ""
            });
        };
        window.addEventListener('cad-selection-update', handleSelectionUpdate);
        return () => window.removeEventListener('cad-selection-update', handleSelectionUpdate);
    }, []);

    const handleAction = (type: string) => {
        // Include prop values for apply action
        const detail: any = { type };
        if (type === 'apply-props') {
            detail.props = {
                width: parseFloat(propValues.width),
                height: parseFloat(propValues.height),
                rotation: parseFloat(propValues.rotation),
                content: propValues.text
            };
        }
        window.dispatchEvent(new CustomEvent('cad-action', { detail }));
    };

    return (
        <aside className="w-72 border-l flex flex-col h-full z-40 bg-card border-border">
            {/* Properties Inspector */}
            <div className="p-3 flex flex-col gap-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <Settings2 size={18} className="text-primary" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Properties</h2>
                </div>

                {selection.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-semibold text-muted-foreground">Width (px)</label>
                                <input
                                    type="text"
                                    value={propValues.width}
                                    onChange={(e) => setPropValues({ ...propValues, width: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-semibold text-muted-foreground">Height (px)</label>
                                <input
                                    type="text"
                                    value={propValues.height}
                                    onChange={(e) => setPropValues({ ...propValues, height: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-semibold text-muted-foreground">Rotation (°)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={propValues.rotation}
                                    onChange={(e) => setPropValues({ ...propValues, rotation: e.target.value })}
                                    className={`w-full ${inputClass}`}
                                />
                                <RotateCw size={14} className="absolute right-2 top-2.5 opacity-30" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-semibold text-muted-foreground">Text Content</label>
                            <input
                                type="text"
                                placeholder="Enter text..."
                                value={propValues.text}
                                onChange={(e) => setPropValues({ ...propValues, text: e.target.value })}
                                className={inputClass}
                            />
                        </div>

                        <button
                            onClick={() => handleAction('apply-props')}
                            className="w-full py-2 text-sm font-semibold rounded hover:shadow-md transition-all bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Apply Changes
                        </button>
                    </div>
                ) : (
                    <div className="py-8 text-center text-xs italic text-muted-foreground">
                        Select an object to inspect properties
                    </div>
                )}
            </div>

            {/* Global Actions */}
            <div className="p-3 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <Hash size={18} className="text-primary" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Global Settings</h2>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer hover:bg-accent" onClick={() => setSmartSnapping(!smartSnapping)}>
                        <div className="flex items-center gap-2">
                            <Magnet size={16} className={smartSnapping ? "text-primary" : "text-muted-foreground"} />
                            <span className="text-sm font-medium text-foreground">Smart Snapping</span>
                        </div>
                        <div className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            smartSnapping ? "bg-primary" : "bg-muted"
                        )}>
                            <div className={cn(
                                "absolute top-0.5 w-3 h-3 bg-background rounded-full transition-all shadow-sm",
                                smartSnapping ? "left-4.5" : "left-0.5"
                            )} />
                        </div>
                    </div>

                    {/* <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-gray-400 font-bold">RADIO ANGLE (°)</label>
                            <span className="text-xs font-mono">{radioAngle}°</span>
                        </div>
                        <input
                            type="range" min="0" max="360" step="15"
                            value={radioAngle}
                            onChange={(e) => setRadioAngle(parseInt(e.target.value))}
                            className="w-full accent-accent-dark h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                    </div> */}

                    {/* <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Scale size={16} className="text-gray-500" />
                                <label className="text-xs text-gray-400 font-bold">MEASURING SCALE</label>
                            </div>
                            <span className="text-xs font-mono">1:{measuringScale}</span>
                        </div>
                        <select
                            value={measuringScale}
                            onChange={(e) => setMeasuringScale(parseFloat(e.target.value))}
                            className="bg-accent-dark hover:bg-accent-light text-black border border-transparent rounded p-1.5 text-xs outline-none font-medium cursor-pointer"
                        >
                            <option value="1">1:1 (Default)</option>
                            <option value="2">1:2</option>
                            <option value="5">1:5</option>
                            <option value="10">1:10</option>
                            <option value="50">1:50</option>
                        </select>
                    </div> */}
                </div>

                <div className="h-px my-2 bg-border" />

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => handleAction('rotate-90')}
                        className="flex items-center justify-center gap-2 p-2 rounded text-xs font-semibold transition-colors shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        <RotateCw size={14} /> Rotate 90
                    </button>
                    <button
                        onClick={() => handleAction('skew')}
                        className="flex items-center justify-center gap-2 p-2 rounded text-xs font-semibold transition-colors shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        <Maximize2 size={14} /> Perspective
                    </button>
                </div>

                <button
                    onClick={() => handleAction('purge')}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded text-xs font-semibold transition-all border border-destructive/20"
                >
                    <Trash2 size={14} /> PURGE SELECTED
                </button>
            </div>
        </aside>
    );
}
