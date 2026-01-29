import { create } from 'zustand';

export type CadTool = 'select' | 'line' | 'rect' | 'circle' | 'poly' | 'eraser' | 'text' | 'measure' | 'angle';
export type CadLayer = 'Walls' | 'Furniture' | 'Electrical';

interface ProjectItem {
    id: string;
    name: string;
    type: string;
    visible: boolean;
    locked: boolean;
}

interface CadState {
    tool: CadTool;
    activeLayer: CadLayer;
    mode: 'dark' | 'light';
    layers: Record<CadLayer, { visible: boolean; locked: boolean }>;
    selection: string[]; // IDs of selected items
    projectTree: ProjectItem[];
    smartSnapping: boolean;
    radioAngle: number;
    measuringScale: number;

    // History State
    undoStack: string[];
    redoStack: string[];
    canvasJSON: string | null; // The JSON of the canvas content
    version: number; // Increment to trigger reload in Editor

    setTool: (tool: CadTool) => void;
    setActiveLayer: (layer: CadLayer) => void;
    toggleMode: () => void;
    setSelection: (ids: string[]) => void;
    setProjectTree: (items: ProjectItem[]) => void;
    toggleLayerVisibility: (layer: CadLayer) => void;
    setSmartSnapping: (enabled: boolean) => void;
    setRadioAngle: (angle: number) => void;
    setMeasuringScale: (scale: number) => void;
    purge: () => void;
    resetCanvas: () => void;

    // History Actions
    pushSnapshot: (json: string) => void;
    undo: () => void;
    redo: () => void;
}

export const useCadStore = create<CadState>((set: any, get: any) => ({
    tool: 'select',
    activeLayer: 'Walls',
    mode: 'dark',
    layers: {
        Walls: { visible: true, locked: false },
        Furniture: { visible: true, locked: false },
        Electrical: { visible: true, locked: false },
    },
    selection: [],
    projectTree: [],
    smartSnapping: true,
    radioAngle: 90,
    measuringScale: 1.0,

    undoStack: [],
    redoStack: [],
    canvasJSON: null,
    version: 0,

    setTool: (tool: CadTool) => set({ tool }),
    setActiveLayer: (layer: CadLayer) => set({ activeLayer: layer }),
    toggleMode: () => set((state: any) => ({ mode: state.mode === 'dark' ? 'light' : 'dark' })),
    setSelection: (ids: string[]) => set({ selection: ids }),
    setProjectTree: (items: any[]) => set({ projectTree: items }),
    toggleLayerVisibility: (layer: CadLayer) => set((state: any) => ({
        layers: {
            ...state.layers,
            [layer]: { ...state.layers[layer], visible: !state.layers[layer].visible }
        }
    })),
    setSmartSnapping: (enabled: boolean) => set({ smartSnapping: enabled }),
    setRadioAngle: (angle: number) => set({ radioAngle: angle }),
    setMeasuringScale: (scale: number) => set({ measuringScale: scale }),
    purge: () => { },
    resetCanvas: () => set((state: any) => ({
        selection: [],
        projectTree: [],
        undoStack: [],
        redoStack: [],
        canvasJSON: null,
        version: state.version + 1
    })),

    pushSnapshot: (json: string) => set((state: any) => {
        // Limit stack size if needed (e.g., 50)
        const newStack = [...state.undoStack, json].slice(-50);
        return {
            undoStack: newStack,
            redoStack: []
            // Do NOT increment version here, as Editor is source of this change
        };
    }),

    undo: () => set((state: any) => {
        if (state.undoStack.length <= 1) return state; // Need at least initial state

        const stack = [...state.undoStack];
        const current = stack.pop(); // Remove current
        const previous = stack[stack.length - 1]; // Peek previous

        return {
            undoStack: stack,
            redoStack: [...state.redoStack, current!],
            canvasJSON: previous,
            version: state.version + 1
        };
    }),

    redo: () => set((state: any) => {
        if (state.redoStack.length === 0) return state;

        const rStack = [...state.redoStack];
        const next = rStack.pop(); // Get next state
        const uStack = [...state.undoStack, next!];

        return {
            undoStack: uStack,
            redoStack: rStack,
            canvasJSON: next!,
            version: state.version + 1
        };
    }),
}));
