"use client";

import { useEffect, useRef, useState } from 'react';
import paper from 'paper';
import { useCadStore, CadTool } from '@/store/useCadStore';
import {
    snap,
    getLayerColor,
    GRID_SIZE,
    getLength,
    getArea,
    rotate90,
    applyShear,
    SCALE_MM_TO_PX,
    SNAP_THRESHOLD,
    applyMagneticSnap
} from '@/lib/cad-engine';

export default function Editor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
        tool,
        activeLayer,
        mode,
        setSelection,
        setProjectTree,
        smartSnapping,
        selection
    } = useCadStore();

    const [inlineEdit, setInlineEdit] = useState<{ id: string, text: string, pos: { x: number, y: number }, fontSize: number } | null>(null);

    // HUD Stats
    const [hudStats, setHudStats] = useState({ length: '0.00', angle: 0, x: '0.00', y: '0.00' });

    // Paper.js Scope & Refs
    const paperScope = useRef<paper.PaperScope | null>(null);
    const activePath = useRef<paper.Path | null>(null); // For drawing
    const dimensionText = useRef<paper.PointText | null>(null); // For drawing dimensions

    // Interaction State
    const selectionGroup = useRef<paper.Group | null>(null); // The visual bounding box UI
    const dragState = useRef<{
        mode: 'none' | 'drawing' | 'moving' | 'resizing' | 'rotating';
        item: paper.Item | null; // The actual selected item
        startPoint: paper.Point;
        startBounds?: paper.Rectangle;
        startRotation?: number;
        handleType?: string; // 'topLeft', 'topRight', 'rotate', etc.
    }>({ mode: 'none', item: null, startPoint: new paper.Point(0, 0) });

    // --- SELECTION UI ---
    // Draws the "Paint-like" bounding box with handles
    const updateSelectionUI = (item: paper.Item | null) => {
        // Clear existing UI
        if (selectionGroup.current) {
            selectionGroup.current.remove();
            selectionGroup.current = null;
        }

        if (!item) return;

        const ui = new paper.Group({ name: 'ui-handles' });

        // 1. Dashed Bounding Box
        const bounds = new paper.Path.Rectangle(item.bounds);
        bounds.strokeColor = new paper.Color('#0099ff');
        bounds.strokeWidth = 1;
        bounds.dashArray = [5, 5];
        bounds.fillColor = new paper.Color(0, 0, 0, 0.001); // Invisible fill to capture clicks for dragging
        bounds.data = { type: 'bbox', item: item };
        ui.addChild(bounds);

        // 2. Corner Resize Handles
        const corners = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'topCenter', 'bottomCenter', 'leftCenter', 'rightCenter'];
        corners.forEach(corner => {
            // @ts-ignore
            const pt = item.bounds[corner];
            const handle = new paper.Path.Rectangle(pt.subtract(4), new paper.Size(8, 8));
            handle.fillColor = new paper.Color('white');
            handle.strokeColor = new paper.Color('black');
            handle.strokeWidth = 1;
            handle.data = { type: 'resize', corner: corner, item: item };
            ui.addChild(handle);
        });

        // 3. Rotation Handle
        const topCenter = item.bounds.topCenter;
        const rotateStick = new paper.Path.Line(topCenter, topCenter.add(new paper.Point(0, -30)));
        rotateStick.strokeColor = new paper.Color('#0099ff');
        ui.addChild(rotateStick);

        const rotateKnob = new paper.Path.Circle(topCenter.add(new paper.Point(0, -30)), 5);
        rotateKnob.fillColor = new paper.Color('white');
        rotateKnob.strokeColor = new paper.Color('#0099ff');
        rotateKnob.strokeWidth = 2;
        rotateKnob.data = { type: 'rotate', item: item };
        ui.addChild(rotateKnob);

        ui.bringToFront();
        selectionGroup.current = ui;

        // Dispatch Properties Update
        let content = "";
        if (item.className === 'PointText') {
            content = (item as paper.PointText).content;
        } else if (item.className === 'Group') {
            const text = item.children.find((c: any) => c.className === 'PointText') as paper.PointText;
            if (text) content = text.content;
        }

        const event = new CustomEvent('cad-selection-update', {
            detail: {
                width: item.bounds.width / SCALE_MM_TO_PX,
                height: item.bounds.height / SCALE_MM_TO_PX,
                rotation: item.rotation,
                content: content
            }
        });
        window.dispatchEvent(event);
    };

    // History Helper
    const saveHistory = () => {
        if (!paperScope.current) return;
        // Clean up UI before saving
        if (selectionGroup.current) selectionGroup.current.remove();

        const json = paperScope.current.project.exportJSON();
        useCadStore.getState().pushSnapshot(json);

        // Restore UI based on Store Selection
        const selectionIds = useCadStore.getState().selection;
        if (selectionIds.length > 0) {
            // Try to find the selected item by ID
            const id = parseInt(selectionIds[0]);
            const item = paperScope.current.project.getItem({ id: id });
            if (item) {
                updateSelectionUI(item);
            }
        }
    };

    const finishInlineEdit = () => {
        if (!inlineEdit) return;
        const item = paper.project.getItem({ id: parseInt(inlineEdit.id) });
        if (item) {
            if (item.className === 'PointText') {
                (item as paper.PointText).content = inlineEdit.text;
            } else if (item.className === 'Group') {
                const t = item.children.find((c: any) => c.className === 'PointText') as paper.PointText;
                if (t) t.content = inlineEdit.text;
            }
            updateSelectionUI(item);
            saveHistory();
        }
        setInlineEdit(null);
    };


    // --- MAIN EFFECT ---
    useEffect(() => {
        if (!canvasRef.current) return;

        // Init Paper
        paper.setup(canvasRef.current);
        paperScope.current = paper;
        paper.view.center = new paper.Point(0, 0);
        drawGrid();

        // Initial Snapshot
        saveHistory();

        // Window Resize
        const handleViewResize = () => {
            if (canvasRef.current && canvasRef.current.parentElement) {
                paper.view.viewSize = new paper.Size(
                    canvasRef.current.parentElement.clientWidth,
                    canvasRef.current.parentElement.clientHeight
                );
                drawGrid();
            }
        };
        window.addEventListener('resize', handleViewResize);
        handleViewResize();

        // --- TOOL HANDLERS ---
        const toolInstance = new paper.Tool();
        let lastClickTime = 0;

        toolInstance.onMouseDown = (event: paper.ToolEvent) => {
            const now = Date.now();
            const isDoubleClick = now - lastClickTime < 300;
            lastClickTime = now;
            const currentTool = useCadStore.getState().tool;
            const currentLayer = useCadStore.getState().activeLayer;
            const currentMode = useCadStore.getState().mode;
            let point = event.point;

            // Smart Snap Logic
            if (useCadStore.getState().smartSnapping) {
                const hit = paper.project.hitTest(event.point, { segments: true, tolerance: 10 });
                point = hit ? hit.point : snap(event.point);
            }

            // 1. INTERACTION TOOLS (Select/Edit)
            if (currentTool === 'select') {
                // Check UI Handles First
                const uiHit = selectionGroup.current?.hitTest(event.point, { fill: true, stroke: true, tolerance: 5 });

                if (uiHit && uiHit.item.data) {
                    const data = uiHit.item.data;
                    const selectedItem = data.item;

                    if (data.type === 'rotate') {
                        dragState.current = {
                            mode: 'rotating',
                            item: selectedItem,
                            startPoint: event.point,
                            startRotation: selectedItem.rotation
                        };
                        return;
                    }
                    else if (data.type === 'resize') {
                        dragState.current = {
                            mode: 'resizing',
                            item: selectedItem,
                            startPoint: event.point,
                            startBounds: selectedItem.bounds.clone(),
                            handleType: data.corner
                        };
                        return;
                    }
                    else if (data.type === 'bbox') {
                        dragState.current = {
                            mode: 'moving',
                            item: selectedItem,
                            startPoint: event.point
                        };
                        return;
                    }
                }

                // Normal Selection (Clicking on objects)
                // Filter out grid and UI
                const hit = paper.project.hitTest(event.point, {
                    fill: true, stroke: true, tolerance: 8,
                    match: (res: paper.HitResult) => res.item.layer.name !== 'grid' && res.item.layer.name !== 'ui-handles'
                });

                if (hit && hit.item) {
                    // Normalize to the root item (if grouped or compound)
                    let target = hit.item;
                    // If hit item is part of a group (that isn't our UI), select the group
                    if (target.parent && target.parent.className === 'Group' && target.parent.name !== 'ui-handles') {
                        target = target.parent as paper.Item;
                    }

                    setSelection([target.id.toString()]);
                    updateSelectionUI(target);

                    // Check for Inline Edit Trigger (Double Click)
                    const isText = target.className === 'PointText' || (target.className === 'Group' && target.children.some((c: any) => c.className === 'PointText'));
                    if (isDoubleClick && isText) {
                        let textItem = target.className === 'PointText' ? target as paper.PointText : target.children.find((c: any) => c.className === 'PointText') as paper.PointText;
                        const viewPos = paper.view.projectToView(textItem.point);
                        setInlineEdit({
                            id: target.id.toString(),
                            text: textItem.content,
                            pos: { x: viewPos.x, y: viewPos.y },
                            fontSize: textItem.fontSize as number
                        });
                        return;
                    }

                    // Also start moving immediately if clicked body
                    dragState.current = {
                        mode: 'moving',
                        item: target,
                        startPoint: event.point
                    };
                } else {
                    if (inlineEdit) finishInlineEdit();
                    // Deselect
                    setSelection([]);
                    updateSelectionUI(null);
                    dragState.current = { mode: 'none', item: null, startPoint: event.point };
                }

            }
            // 2. DRAWING TOOLS
            else {
                // Clean up selection when drawing
                if (selectionGroup.current) {
                    selectionGroup.current.remove();
                    selectionGroup.current = null;
                    setSelection([]);
                }

                dragState.current = { mode: 'drawing', item: null, startPoint: point };

                // Use lighter grey for all shapes in both modes
                const color = '#4a4a4a'; // Lighter grey for shapes
                const strokeWidth = currentLayer === 'Walls' ? 2 : 1;

                // ... drawing logic handled in drag/up ...
                if (currentTool === 'line') {
                    const path = new paper.Path({
                        segments: [point, point],
                        strokeColor: color,
                        strokeWidth: strokeWidth,
                        data: { layer: currentLayer, type: 'line' }
                    });
                    activePath.current = path;

                    dimensionText.current = new paper.PointText({
                        point: point, content: '0mm',
                        fillColor: 'black',
                        fontSize: 14,
                        fontFamily: 'sans-serif',
                        justification: 'center'
                    });

                } else if (currentTool === 'rect') {
                    const path = new paper.Path.Rectangle({
                        point: point, size: [1, 1],
                        strokeColor: color, strokeWidth: strokeWidth,
                        fillColor: new paper.Color(0, 0, 0, 0.05), // Hit area
                        data: { layer: currentLayer, type: 'rect' }
                    });
                    activePath.current = path;

                    dimensionText.current = new paper.PointText({
                        point: point, content: 'W: 0 H: 0',
                        fillColor: 'black',
                        fontSize: 14,
                        fontFamily: 'sans-serif',
                        justification: 'center'
                    });

                } else if (currentTool === 'circle') {
                    const path = new paper.Path.Circle({
                        center: point, radius: 1,
                        strokeColor: color, strokeWidth: strokeWidth,
                        fillColor: new paper.Color(0, 0, 0, 0.05),
                        data: { layer: currentLayer, type: 'circle' }
                    });
                    activePath.current = path;

                    dimensionText.current = new paper.PointText({
                        point: point, content: 'R: 0mm',
                        fillColor: 'black',
                        fontSize: 14,
                        fontFamily: 'sans-serif',
                        justification: 'center'
                    });

                } else if (currentTool === 'poly') {
                    const path = new paper.Path.RegularPolygon({
                        center: point,
                        sides: 6,
                        radius: 1,
                        strokeColor: color,
                        strokeWidth: strokeWidth,
                        fillColor: new paper.Color(0, 0, 0, 0.05),
                        data: { layer: currentLayer, type: 'poly' }
                    });
                    activePath.current = path;
                    dimensionText.current = new paper.PointText({
                        point: point, content: 'R: 0mm',
                        fillColor: 'black',
                        fontSize: 14,
                        fontFamily: 'sans-serif',
                        justification: 'center'
                    });
                } else if (currentTool === 'text') {
                    const text = new paper.PointText({
                        point: point, content: 'Text',
                        fillColor: 'black',
                        fontSize: 20, fontFamily: 'sans-serif',
                        data: { layer: currentLayer, type: 'text' }
                    });
                    setSelection([text.id.toString()]);
                    updateSelectionUI(text);
                    updateProjectTree();
                    saveHistory();
                } else if (currentTool === 'eraser') {
                    const hit = paper.project.hitTest(event.point, { stroke: true, fill: true, tolerance: 5 });
                    if (hit && hit.item && hit.item.layer.name !== 'grid') {
                        hit.item.remove();
                        updateProjectTree();
                    }
                }
            }
        };

        toolInstance.onMouseMove = (event: paper.ToolEvent) => {
            const currentTool = useCadStore.getState().tool;
            const snapEnabled = useCadStore.getState().smartSnapping;

            // 1. Calculate Snapped Point for HUD Visualization
            let point = event.point;
            if (snapEnabled) {
                // Priority: Object Snap (Segments) -> Grid Snap
                const hit = paper.project.hitTest(event.point, { segments: true, tolerance: 10 });
                point = hit ? hit.point : snap(event.point);
            }

            // 2. Update HUD
            setHudStats(prev => ({
                ...prev,
                x: (point.x / SCALE_MM_TO_PX).toFixed(2),
                y: (point.y / SCALE_MM_TO_PX).toFixed(2) // Invert Y if needed for CAD coords, but Paper is decent
            }));

            // 3. Selection Cursor Logic
            if (currentTool === 'select') {
                let cursorSet = false;

                if (selectionGroup.current) {
                    const hit = selectionGroup.current.hitTest(event.point, { fill: true, stroke: true, tolerance: 5 });
                    if (hit && hit.item.data) {
                        const type = hit.item.data.type;
                        if (type === 'resize') {
                            const corner = hit.item.data.corner;
                            if (corner === 'topLeft' || corner === 'bottomRight') document.body.style.cursor = 'nwse-resize';
                            else if (corner === 'topRight' || corner === 'bottomLeft') document.body.style.cursor = 'nesw-resize';
                            else if (corner === 'topCenter' || corner === 'bottomCenter') document.body.style.cursor = 'ns-resize';
                            else if (corner === 'leftCenter' || corner === 'rightCenter') document.body.style.cursor = 'ew-resize';
                        } else if (type === 'rotate') {
                            document.body.style.cursor = 'grab';
                        } else if (type === 'bbox') {
                            document.body.style.cursor = 'move';
                        }
                        cursorSet = true;
                    }
                }

                if (!cursorSet && dragState.current.mode === 'none') {
                    document.body.style.cursor = 'default';
                }
            } else {
                document.body.style.cursor = 'crosshair';
            }
        };

        toolInstance.onMouseDrag = (event: paper.ToolEvent) => {
            const snapEnabled = useCadStore.getState().smartSnapping;
            let point = event.point;
            if (snapEnabled) {
                const hit = paper.project.hitTest(event.point, { segments: true, tolerance: 10 });
                point = hit ? hit.point : snap(event.point);
            }

            // HUD Stats
            const vector = point.subtract(dragState.current.startPoint);
            const dist = (vector.length / SCALE_MM_TO_PX).toFixed(2);
            const ang = Math.round(vector.angle < 0 ? vector.angle + 360 : vector.angle);
            setHudStats({
                length: dist,
                angle: ang,
                x: (point.x / SCALE_MM_TO_PX).toFixed(2),
                y: (point.y / SCALE_MM_TO_PX).toFixed(2)
            });


            // HANDLE MODES
            if (dragState.current.mode === 'moving' && dragState.current.item) {
                // Apply regular movement
                dragState.current.item.position = dragState.current.item.position.add(event.delta);
                
                // Apply magnetic snapping if enabled
                if (snapEnabled) {
                    // Get all items in the project (excluding UI and grid)
                    // Only get top-level items (Groups or standalone Paths, not children)
                    const allItems = paper.project.getItems({
                        match: (item: paper.Item) => {
                            // Skip grid, UI, and Layer items
                            if (item.layer?.name === 'grid') return false;
                            if (item.layer?.name === 'ui-handles') return false;
                            if (item.className === 'Layer') return false;
                            
                            // Only include Groups or Paths that are not children of other Groups
                            if (item.className === 'Group') return true;
                            if (item.className === 'Path' && item.parent?.className !== 'Group') return true;
                            
                            return false;
                        }
                    });

                    // Try to snap the active item to nearby shapes
                    const snappedPosition = applyMagneticSnap(
                        dragState.current.item,
                        allItems,
                        SNAP_THRESHOLD
                    );

                    // Apply the snap if one was found
                    if (snappedPosition) {
                        dragState.current.item.position = snappedPosition;
                    }
                }
                
                updateSelectionUI(dragState.current.item);
            }
            else if (dragState.current.mode === 'rotating' && dragState.current.item) {
                const center = dragState.current.item.bounds.center;
                const currentVec = event.point.subtract(center);
                const prevVec = event.point.subtract(event.delta).subtract(center);
                const angleDiff = currentVec.angle - prevVec.angle;
                dragState.current.item.rotate(angleDiff, center);
                updateSelectionUI(dragState.current.item);
            }
            else if (dragState.current.mode === 'resizing' && dragState.current.item) {
                const item = dragState.current.item;
                const corner = dragState.current.handleType;
                const startBounds = dragState.current.startBounds;

                if (!startBounds) return;

                // Calculate the new bounds based on the dragged corner/edge
                let newBounds = startBounds.clone();

                if (corner === 'bottomRight') {
                    newBounds.width = Math.max(10, point.x - newBounds.left);
                    newBounds.height = Math.max(10, point.y - newBounds.top);
                }
                else if (corner === 'topLeft') {
                    const oldRight = newBounds.right;
                    const oldBottom = newBounds.bottom;
                    newBounds.left = Math.min(point.x, oldRight - 10);
                    newBounds.top = Math.min(point.y, oldBottom - 10);
                    newBounds.right = oldRight;
                    newBounds.bottom = oldBottom;
                }
                else if (corner === 'topRight') {
                    const oldLeft = newBounds.left;
                    const oldBottom = newBounds.bottom;
                    newBounds.right = Math.max(point.x, oldLeft + 10);
                    newBounds.top = Math.min(point.y, oldBottom - 10);
                    newBounds.left = oldLeft;
                    newBounds.bottom = oldBottom;
                }
                else if (corner === 'bottomLeft') {
                    const oldRight = newBounds.right;
                    const oldTop = newBounds.top;
                    newBounds.left = Math.min(point.x, oldRight - 10);
                    newBounds.bottom = Math.max(point.y, oldTop + 10);
                    newBounds.right = oldRight;
                    newBounds.top = oldTop;
                }
                else if (corner === 'topCenter') {
                    const oldBottom = newBounds.bottom;
                    newBounds.top = Math.min(point.y, oldBottom - 10);
                    newBounds.bottom = oldBottom;
                }
                else if (corner === 'bottomCenter') {
                    const oldTop = newBounds.top;
                    newBounds.bottom = Math.max(point.y, oldTop + 10);
                    newBounds.top = oldTop;
                }
                else if (corner === 'leftCenter') {
                    const oldRight = newBounds.right;
                    newBounds.left = Math.min(point.x, oldRight - 10);
                    newBounds.right = oldRight;
                }
                else if (corner === 'rightCenter') {
                    const oldLeft = newBounds.left;
                    newBounds.right = Math.max(point.x, oldLeft + 10);
                    newBounds.left = oldLeft;
                }

                // Apply the new bounds using scaling to maintain shape integrity
                const scaleX = newBounds.width / startBounds.width;
                const scaleY = newBounds.height / startBounds.height;
                
                // Store center before scaling
                const oldCenter = item.bounds.center;
                
                // Reset to original bounds first
                item.bounds = startBounds;
                
                // Apply scale from center
                item.scale(scaleX, scaleY, startBounds.center);
                
                // Reposition to match the new bounds
                item.position = item.position.add(newBounds.center.subtract(item.bounds.center));

                updateSelectionUI(item);
            }
            else if (dragState.current.mode === 'drawing' && activePath.current) {
                const path = activePath.current;

                if (path.data.type === 'line') {
                    path.segments[1].point = point;
                    // stats updated via setHudStats above
                    if (dimensionText.current) {
                        dimensionText.current.content = `${dist}mm`;
                        // Position text above the line midpoint
                        dimensionText.current.point = path.getPointAt(path.length / 2).add([0, -15]);
                        dimensionText.current.justification = 'center';
                    }

                } else if (path.data.type === 'rect') {
                    // Logic to redraw rect from start point
                    const start = path.segments[0].point; // or dragState.startPoint
                    const newRect = new paper.Path.Rectangle(start, point);
                    // Copy style
                    newRect.strokeColor = path.strokeColor;
                    newRect.strokeWidth = path.strokeWidth;
                    newRect.fillColor = path.fillColor;
                    newRect.data = path.data;

                    path.remove();
                    activePath.current = newRect;

                    if (dimensionText.current) {
                        const w = Math.abs(newRect.bounds.width / SCALE_MM_TO_PX).toFixed(0);
                        const h = Math.abs(newRect.bounds.height / SCALE_MM_TO_PX).toFixed(0);
                        dimensionText.current.content = `W: ${w} H: ${h}`;
                        // Position text above the rectangle with offset
                        dimensionText.current.point = newRect.bounds.topCenter.subtract([0, 5]);
                        dimensionText.current.justification = 'center';
                    }

                } else if (path.data.type === 'circle') {
                    const center = path.bounds.center; // Actually for circle drawn from center, startPoint is center
                    const radius = point.getDistance(path.position);
                    const newCirc = new paper.Path.Circle(path.position, radius);
                    newCirc.strokeColor = path.strokeColor;
                    newCirc.strokeWidth = path.strokeWidth;
                    newCirc.fillColor = path.fillColor;
                    newCirc.data = path.data;

                    path.remove();
                    activePath.current = newCirc;

                    if (dimensionText.current) {
                        dimensionText.current.content = `R: ${(radius / SCALE_MM_TO_PX).toFixed(1)}mm`;
                        // Position text above the circle with better offset
                        dimensionText.current.point = newCirc.position.add([0, -radius - 20]);
                        dimensionText.current.justification = 'center';
                    }
                } else if (path.data.type === 'poly') {
                    const radius = point.getDistance(path.position);
                    const newPoly = new paper.Path.RegularPolygon({
                        center: path.position,
                        sides: 6,
                        radius: radius,
                        strokeColor: path.strokeColor,
                        strokeWidth: path.strokeWidth,
                        fillColor: path.fillColor,
                        data: path.data
                    });
                    path.remove();
                    activePath.current = newPoly;
                    if (dimensionText.current) {
                        dimensionText.current.content = `R: ${(radius / SCALE_MM_TO_PX).toFixed(1)}mm`;
                        // Position text above the polygon
                        dimensionText.current.point = newPoly.bounds.topCenter.subtract([0, 5]);
                        dimensionText.current.justification = 'center';
                    }
                }
            }
        };

        toolInstance.onMouseUp = () => {
            // Reset Cursor
            document.body.style.cursor = 'default';

            // GROUPING logic for persistance
            if (dragState.current.mode === 'drawing' && activePath.current && dimensionText.current) {
                const group = new paper.Group([activePath.current, dimensionText.current]);
                // Inherit data from path so layer logic works
                group.data = { ...activePath.current.data };
                // DO NOT REMOVE dimensionText.current
            }

            // Update selection UI after resize/rotate/move operations
            if ((dragState.current.mode === 'resizing' || dragState.current.mode === 'rotating' || dragState.current.mode === 'moving') && dragState.current.item) {
                updateSelectionUI(dragState.current.item);
                // Dispatch selection update event for properties panel
                const item = dragState.current.item;
                window.dispatchEvent(new CustomEvent('cad-selection-update', {
                    detail: {
                        width: item.bounds.width,
                        height: item.bounds.height,
                        rotation: item.rotation,
                        content: item.className === 'PointText' ? (item as paper.PointText).content : ''
                    }
                }));
            }

            // SAVE HISTORY if something happened
            if (dragState.current.mode !== 'none' || activePath.current) {
                saveHistory();
            }

            dragState.current.mode = 'none';
            dragState.current.item = null;
            activePath.current = null;
            dimensionText.current = null; // Clear ref but text item stays in project (via Group)

            updateProjectTree();
        };

        // -- EXTERNAL ACTIONS --
        const handleCadAction = (e: any) => {
            const { type } = e.detail;
            const project = paperScope.current?.project;
            if (!project) return;

            const selectedIds = useCadStore.getState().selection;
            const selected = selectedIds
                .map((id: any) => project.getItem({ id: parseInt(id) }))
                .filter(Boolean) as paper.Item[];

            if (type === 'select-by-id') {
                const item = project.getItem({ id: parseInt(e.detail.id) });
                if (item) {
                    setSelection([e.detail.id]);
                    updateSelectionUI(item);
                }
            } else if (type === 'rotate-90') {
                selected.forEach(i => i.rotate(90));
                if (selected.length === 1) updateSelectionUI(selected[0]);
                saveHistory(); // Save
            } else if (type === 'skew') {
                selected.forEach(i => {
                    const m = new paper.Matrix();
                    m.shear(0.5, 0); // Isometric Skew
                    i.transform(m);
                });
                if (selected.length === 1) updateSelectionUI(selected[0]);
                saveHistory(); // Save
            } else if (type === 'purge') {
                selected.forEach(i => i.remove());
                setSelection([]);
                if (selectionGroup.current) selectionGroup.current.remove();
                updateProjectTree();
                saveHistory(); // Save
            } else if (type === 'apply-props') {
                const { props } = e.detail;
                selected.forEach(item => {
                    // Handle Rotation
                    if (props.rotation !== undefined && !isNaN(props.rotation)) {
                        item.rotation = props.rotation;
                    }

                    // Handle Dimensions (Scaling)
                    if (props.width !== undefined && props.height !== undefined && !isNaN(props.width) && !isNaN(props.height)) {
                        const currentW = item.bounds.width / SCALE_MM_TO_PX;
                        const currentH = item.bounds.height / SCALE_MM_TO_PX;

                        if (currentW > 0 && currentH > 0) {
                            const scaleX = props.width / currentW;
                            const scaleY = props.height / currentH;
                            item.scale(scaleX, scaleY);
                        }
                    }

                    // Handle Text
                    if (props.content !== undefined) {
                        let textItem: paper.PointText | null = null;
                        if (item.className === 'PointText') {
                            textItem = item as paper.PointText;
                        } else if (item.className === 'Group') {
                            textItem = item.children.find((c: any) => c.className === 'PointText') as paper.PointText;
                        }

                        if (textItem) {
                            textItem.content = props.content;
                        }
                    }
                });
                if (selected.length === 1) updateSelectionUI(selected[0]);
                saveHistory();
                paperScope.current?.view.update();
            }
            paperScope.current?.view.update();
        };
        window.addEventListener('cad-action', handleCadAction);

        // Keyboard Shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Tool shortcuts (single keys)
            if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
                const key = e.key.toLowerCase();
                const toolMap: Record<string, CadTool> = {
                    'v': 'select',
                    'l': 'line',
                    'r': 'rect',
                    'c': 'circle',
                    'p': 'poly',
                    't': 'text',
                    'e': 'eraser'
                };
                
                if (toolMap[key]) {
                    // Don't trigger tool change if user is editing text
                    const currentSelection = useCadStore.getState().selection;
                    if (currentSelection.length === 1) {
                        const item = paperScope.current?.project.getItem({ id: parseInt(currentSelection[0]) });
                        const isText = item && (item.className === 'PointText' || (item.className === 'Group' && item.children.some((c: any) => c.className === 'PointText')));
                        if (isText) return; // User is editing text, don't change tool
                    }
                    
                    e.preventDefault();
                    useCadStore.getState().setTool(toolMap[key]);
                    return;
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    useCadStore.getState().redo();
                } else {
                    useCadStore.getState().undo();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                useCadStore.getState().redo();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                const currentSelection = useCadStore.getState().selection;
                if (currentSelection.length > 0) {
                    e.preventDefault();
                    currentSelection.forEach((id: any) => {
                        const item = paperScope.current?.project.getItem({ id: parseInt(id) });
                        if (item) item.remove();
                    });
                    setSelection([]);
                    if (selectionGroup.current) selectionGroup.current.remove();
                    updateProjectTree();
                    saveHistory();
                }
            } else if (useCadStore.getState().selection.length === 1) {
                // Figma-like: Type to Edit
                const currentSelection = useCadStore.getState().selection;
                const item = paperScope.current?.project.getItem({ id: parseInt(currentSelection[0]) });
                if (item) {
                    const isText = item.className === 'PointText' || (item.className === 'Group' && item.children.some((c: any) => c.className === 'PointText'));
                    // Only trigger if it's a character or Enter, and not a shortcut
                    if (isText && (e.key.length === 1 || e.key === 'Enter') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        let textItem = item.className === 'PointText' ? item as paper.PointText : item.children.find((c: any) => c.className === 'PointText') as paper.PointText;
                        const viewPos = paper.view.projectToView(textItem.point);
                        setInlineEdit({
                            id: item.id.toString(),
                            text: e.key === 'Enter' ? textItem.content : e.key,
                            pos: { x: viewPos.x, y: viewPos.y },
                            fontSize: textItem.fontSize as number
                        });
                        e.preventDefault();
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            // @ts-ignore
            window.removeEventListener('resize', handleViewResize);
            window.removeEventListener('cad-action', handleCadAction);
            window.removeEventListener('keydown', handleKeyDown);
            paper.project.clear();
        };

    }, []); // End of useEffect

    // Undo/Redo Effect
    const version = useCadStore((s: any) => s.version);
    useEffect(() => {
        if (!paperScope.current) return;
        const project = paperScope.current.project;
        const json = useCadStore.getState().canvasJSON;

        if (json) {
            project.clear();
            project.importJSON(json);
            refreshTheme(useCadStore.getState().mode);
            setSelection([]);
            updateProjectTree();
            selectionGroup.current = null;
        } else if (json === null && version > 0) {
            // Reset canvas when json is null (resetCanvas was called)
            project.clear();
            drawGrid();
            setSelection([]);
            updateProjectTree();
            selectionGroup.current = null;
        }
    }, [version]);

    const refreshTheme = (currentMode: 'light' | 'dark') => {
        if (!paper.project) return;
        drawGrid();
        paper.project.getItems({}).forEach((item: any) => {
            if (item.data?.layer) {
                // Use lighter grey for all shapes in both modes
                item.strokeColor = new paper.Color('#4a4a4a');
                // If it's a rectangle/circle with fill, make it very subtle
                if (item.className === 'Path' && item.fillColor) {
                    item.fillColor = new paper.Color(0, 0, 0, 0.05);
                }
            }
            if (item.className === 'PointText') {
                (item as paper.PointText).fillColor = new paper.Color('black');
                (item as paper.PointText).fontFamily = 'sans-serif';
                (item as paper.PointText).fontWeight = 'normal';
            }
        });
        paper.view.update();
    };

    // Grid & Theme Effect
    useEffect(() => {
        refreshTheme(mode);
    }, [mode]);

    // Helpers
    const drawGrid = () => {
        const view = paper.view;
        if (!view) return;

        // Re-init grid layer
        const oldGrid = paper.project.layers.find((l: any) => l.name === 'grid');
        if (oldGrid) oldGrid.remove();

        const gridLayer = new paper.Layer({ name: 'grid' });
        // Use dark grid lines since canvas is always white
        const color = 'rgba(0,0,0,0.08)';

        // ... Simple grid draw loop ...
        for (let x = Math.ceil(view.bounds.left / GRID_SIZE) * GRID_SIZE; x < view.bounds.right; x += GRID_SIZE) {
            const l = new paper.Path.Line(new paper.Point(x, view.bounds.top), new paper.Point(x, view.bounds.bottom));
            l.strokeColor = new paper.Color(color);
        }
        for (let y = Math.ceil(view.bounds.top / GRID_SIZE) * GRID_SIZE; y < view.bounds.bottom; y += GRID_SIZE) {
            const l = new paper.Path.Line(new paper.Point(view.bounds.left, y), new paper.Point(view.bounds.right, y));
            l.strokeColor = new paper.Color(color);
        }

        gridLayer.sendToBack();

        // Ensure Main Layer Exists
        let main = paper.project.layers.find((l: any) => l.name === 'main');
        if (!main) main = new paper.Layer({ name: 'main' });
        main.activate();
    };

    const updateProjectTree = () => {
        const items = paper.project.layers.find((l: any) => l.name === 'main')?.children || [];
        setProjectTree(items.map((i: any) => ({
            id: i.id.toString(),
            name: (i.data.type || 'Object').toUpperCase(),
            type: i.data.type || 'path', visible: i.visible, locked: i.locked
        })));
    };

    return (
        <div className="w-full h-full cursor-crosshair relative overflow-hidden" onClick={() => canvasRef.current?.focus()}>
            <canvas
                ref={canvasRef}
                id="cad-canvas"
                tabIndex={0}
                className="w-full h-full outline-none focus:ring-0"
            />
            {/* HUD */}
            <div className="absolute bottom-6 left-6 flex gap-4 pointer-events-none">
                <div className="glass px-4 py-2 rounded-lg text-xs font-mono flex flex-col !text-black !bg-white shadow-xl border border-gray-200/50">
                    <span className="opacity-50">LOCATION</span>
                    <span>X: {hudStats.x} Y: {hudStats.y}</span>
                </div>
                <div className="glass px-4 py-2 rounded-lg text-xs font-mono flex flex-col !text-black !bg-white shadow-xl border border-gray-200/50">
                    <span className="opacity-50">MEASURE</span>
                    <span>L: {hudStats.length}mm &ang;: {hudStats.angle}&deg;</span>
                </div>
                <div className="glass px-4 py-2 rounded-lg text-xs font-mono flex flex-col !text-black !bg-white shadow-xl border border-gray-200/50">
                    <span className="opacity-50">TOOL</span>
                    <span className="uppercase text-accent-dark">{tool}</span>
                </div>
            </div>
            {/* Inline Text Editor Overlay */}
            {inlineEdit && (
                <div
                    className="absolute z-[100] flex items-center pointer-events-auto"
                    style={{
                        left: `${inlineEdit.pos.x}px`,
                        top: `${inlineEdit.pos.y - (inlineEdit.fontSize / 2)}px`,
                        transform: 'translateY(-20%)'
                    }}
                >
                    <input
                        autoFocus
                        type="text"
                        value={inlineEdit.text}
                        onChange={(e) => setInlineEdit({ ...inlineEdit, text: e.target.value })}
                        onBlur={finishInlineEdit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                finishInlineEdit();
                            }
                            if (e.key === 'Escape') setInlineEdit(null);
                        }}
                        className="bg-white dark:bg-gray-800 text-black dark:text-white border-2 border-accent-dark outline-none px-2 py-1 rounded shadow-2xl font-display min-w-[120px]"
                        style={{ fontSize: `${inlineEdit.fontSize}px`, lineHeight: '1.2' }}
                    />
                </div>
            )}
        </div>
    );
}
