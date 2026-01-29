import paper from 'paper';

export const GRID_SIZE = 40;
export const SCALE_MM_TO_PX = 10; // 10px = 1mm
export const SNAP_THRESHOLD = 8; // Magnetic snap activates within 8px

export const snap = (point: paper.Point): paper.Point => {
    return new paper.Point(
        Math.round(point.x / GRID_SIZE) * GRID_SIZE,
        Math.round(point.y / GRID_SIZE) * GRID_SIZE
    );
};

export const getLength = (path: paper.Path): number => {
    return parseFloat((path.length / SCALE_MM_TO_PX).toFixed(2));
};

export const getArea = (path: paper.Path): number => {
    // area is in px^2. 100 px^2 = 1 mm^2. 1,000,000 mm^2 = 1 m^2.
    // path.area is in square units.
    const areaMm2 = Math.abs(path.area) / (SCALE_MM_TO_PX * SCALE_MM_TO_PX);
    const areaM2 = areaMm2 / 1000000;
    return parseFloat(areaM2.toFixed(4));
};

export const getAngle = (p1: paper.Point, p2: paper.Point): number => {
    const delta = p2.subtract(p1);
    return parseFloat(delta.angle.toFixed(2));
};

export const applyShear = (item: paper.Item, amount: number) => {
    const matrix = new paper.Matrix();
    matrix.shear(amount, 0);
    item.transform(matrix);
};

export const rotate90 = (item: paper.Item) => {
    item.rotate(90);
};

export const getLayerColor = (layerName: string, mode: 'dark' | 'light') => {
    if (mode === 'dark') {
        switch (layerName) {
            case 'Walls': return '#fbbf24'; // Amber
            case 'Furniture': return '#3b82f6'; // Blue
            case 'Electrical': return '#22c55e'; // Green
            default: return '#ffffff';
        }
    } else {
        switch (layerName) {
            case 'Walls': return '#fbbf24'; // Amber/Gold
            case 'Furniture': return '#2563eb'; // Deep Blue
            case 'Electrical': return '#16a34a'; // Deep Green
            default: return '#000000';
        }
    }
};

// ========================================
// MAGNETIC SNAPPING UTILITIES
// ========================================

/**
 * Check if an item is a circle (Path.Circle)
 * Handles both direct Path items and Groups containing paths
 */
export const isCircle = (item: paper.Item): boolean => {
    // If it's a Group, check the first Path child
    if (item.className === 'Group') {
        const group = item as paper.Group;
        const pathChild = group.children.find((c: any) => c.className === 'Path') as paper.Path;
        if (!pathChild) return false;
        if (pathChild.data?.type === 'circle') return true;
        if (!pathChild.closed) return false;
        const segments = pathChild.segments.length;
        const bounds = pathChild.bounds;
        const aspectRatio = bounds.width / bounds.height;
        return segments === 4 && Math.abs(aspectRatio - 1) < 0.01;
    }
    
    if (item.className !== 'Path') return false;
    const path = item as paper.Path;
    // Check if it has a data.type marker
    if (path.data?.type === 'circle') return true;
    // Fallback: check if it's circular based on geometry
    if (!path.closed) return false;
    // A circle has only 1 or 2 segments with handles (Paper.js representation)
    // Or check bounds aspect ratio and segment count
    const segments = path.segments.length;
    const bounds = path.bounds;
    const aspectRatio = bounds.width / bounds.height;
    // Circles typically have 4 segments (quadrants) with specific handles
    return segments === 4 && Math.abs(aspectRatio - 1) < 0.01;
};

/**
 * Check if an item is a rectangle
 * Handles both direct Path items and Groups containing paths
 */
export const isRectangle = (item: paper.Item): boolean => {
    // If it's a Group, check the first Path child
    if (item.className === 'Group') {
        const group = item as paper.Group;
        const pathChild = group.children.find((c: any) => c.className === 'Path') as paper.Path;
        if (!pathChild) return false;
        if (pathChild.data?.type === 'rect') return true;
        return pathChild.closed && pathChild.segments.length === 4;
    }
    
    if (item.className !== 'Path') return false;
    const path = item as paper.Path;
    if (path.data?.type === 'rect') return true;
    // Fallback: rectangle has 4 segments and 4 corners
    return path.closed && path.segments.length === 4;
};

/**
 * Check if an item is a regular polygon (hexagon, etc)
 * Handles both direct Path items and Groups containing paths
 */
export const isPolygon = (item: paper.Item): boolean => {
    // If it's a Group, check the first Path child
    if (item.className === 'Group') {
        const group = item as paper.Group;
        const pathChild = group.children.find((c: any) => c.className === 'Path') as paper.Path;
        if (!pathChild) return false;
        if (pathChild.data?.type === 'poly') return true;
        return pathChild.closed && pathChild.segments.length > 4;
    }
    
    if (item.className !== 'Path') return false;
    const path = item as paper.Path;
    if (path.data?.type === 'poly') return true;
    // Polygons typically have more than 4 segments
    return path.closed && path.segments.length > 4;
};

/**
 * Snap two circles so they are tangent (touching perfectly)
 * Returns the adjusted position for the active circle, or null if no snap needed
 * 
 * Formula: distance between centers = radius1 + radius2
 */
export const snapCircleToCircle = (
    active: paper.Item,
    target: paper.Item,
    threshold: number = SNAP_THRESHOLD
): paper.Point | null => {
    if (!isCircle(active) || !isCircle(target)) return null;

    // Extract the actual Path from Groups if needed
    const getPath = (item: paper.Item): paper.Path => {
        if (item.className === 'Group') {
            const group = item as paper.Group;
            return group.children.find((c: any) => c.className === 'Path') as paper.Path;
        }
        return item as paper.Path;
    };

    const activePath = getPath(active);
    const targetPath = getPath(target);
    
    if (!activePath || !targetPath) return null;

    // Get radii from bounds (diameter / 2)
    const activeRadius = activePath.bounds.width / 2;
    const targetRadius = targetPath.bounds.width / 2;

    // Ideal tangent distance
    const idealDistance = activeRadius + targetRadius;

    // Current distance between centers (use the Group/Item position, not path position)
    const activeCenter = active.position;
    const targetCenter = target.position;
    const currentDistance = activeCenter.getDistance(targetCenter);

    // Check if within threshold
    if (Math.abs(currentDistance - idealDistance) > threshold) {
        return null; // Too far, no snap
    }

    // Calculate snap position: move active circle so it's exactly tangent
    const direction = activeCenter.subtract(targetCenter).normalize();
    const newPosition = targetCenter.add(direction.multiply(idealDistance));

    return newPosition;
};

/**
 * Snap rectangle/polygon to rectangle/polygon using edge-to-edge alignment
 * Returns adjusted position for active item, or null if no snap needed
 * 
 * Logic:
 * - Check all 4 edges of active against all 4 edges of target
 * - For each pair, check if they're parallel and close enough
 * - If yes, align them to share the same edge (no gap, no overlap)
 */
export const snapRectToRect = (
    active: paper.Item,
    target: paper.Item,
    threshold: number = SNAP_THRESHOLD
): paper.Point | null => {
    const activeBounds = active.bounds;
    const targetBounds = target.bounds;

    // Define edges for both items
    const activeEdges = {
        top: activeBounds.top,
        bottom: activeBounds.bottom,
        left: activeBounds.left,
        right: activeBounds.right
    };

    const targetEdges = {
        top: targetBounds.top,
        bottom: targetBounds.bottom,
        left: targetBounds.left,
        right: targetBounds.right
    };

    const candidates: { offset: paper.Point; distance: number }[] = [];

    // More lenient alignment check: shapes should be reasonably close in perpendicular axis
    // Allow snapping even if there's a small gap in perpendicular direction
    const alignmentTolerance = 50; // pixels - can adjust if needed

    // Check horizontal edge snapping (top/bottom alignment)
    // Active's bottom edge to target's top edge (active below target)
    const bottomToTop = Math.abs(activeEdges.bottom - targetEdges.top);
    if (bottomToTop < threshold) {
        // Check if rectangles are reasonably aligned horizontally (with tolerance)
        const gapX = Math.max(
            activeEdges.left - targetEdges.right,
            targetEdges.left - activeEdges.right
        );
        // If shapes overlap OR are within tolerance distance in X direction
        if (gapX < alignmentTolerance) {
            const offset = new paper.Point(0, targetEdges.top - activeEdges.bottom);
            candidates.push({ offset, distance: bottomToTop });
        }
    }

    // Active's top edge to target's bottom edge (active above target)
    const topToBottom = Math.abs(activeEdges.top - targetEdges.bottom);
    if (topToBottom < threshold) {
        const gapX = Math.max(
            activeEdges.left - targetEdges.right,
            targetEdges.left - activeEdges.right
        );
        if (gapX < alignmentTolerance) {
            const offset = new paper.Point(0, targetEdges.bottom - activeEdges.top);
            candidates.push({ offset, distance: topToBottom });
        }
    }

    // Check vertical edge snapping (left/right alignment)
    // Active's right edge to target's left edge (active to left of target)
    const rightToLeft = Math.abs(activeEdges.right - targetEdges.left);
    if (rightToLeft < threshold) {
        const gapY = Math.max(
            activeEdges.top - targetEdges.bottom,
            targetEdges.top - activeEdges.bottom
        );
        if (gapY < alignmentTolerance) {
            const offset = new paper.Point(targetEdges.left - activeEdges.right, 0);
            candidates.push({ offset, distance: rightToLeft });
        }
    }

    // Active's left edge to target's right edge (active to right of target)
    const leftToRight = Math.abs(activeEdges.left - targetEdges.right);
    if (leftToRight < threshold) {
        const gapY = Math.max(
            activeEdges.top - targetEdges.bottom,
            targetEdges.top - activeEdges.bottom
        );
        if (gapY < alignmentTolerance) {
            const offset = new paper.Point(targetEdges.right - activeEdges.left, 0);
            candidates.push({ offset, distance: leftToRight });
        }
    }

    // Find the best candidate (closest snap)
    if (candidates.length === 0) return null;
    
    const bestSnap = candidates.reduce((best, current) => 
        current.distance < best.distance ? current : best
    );

    return active.position.add(bestSnap.offset);
};

/**
 * Apply magnetic snapping to an item being dragged
 * Checks all other items in the project and snaps to the closest valid target
 * 
 * @param activeItem - The item being dragged
 * @param allItems - All items in the project to check against
 * @param threshold - Distance threshold for snapping activation
 * @returns The snapped position, or null if no snap applies
 */
export const applyMagneticSnap = (
    activeItem: paper.Item,
    allItems: paper.Item[],
    threshold: number = SNAP_THRESHOLD
): paper.Point | null => {
    let bestSnapPosition: paper.Point | null = null;
    let bestDistance = threshold;

    for (const targetItem of allItems) {
        // Don't snap to self
        if (targetItem.id === activeItem.id) continue;

        let snapPosition: paper.Point | null = null;

        // Circle to Circle snapping
        if (isCircle(activeItem) && isCircle(targetItem)) {
            snapPosition = snapCircleToCircle(activeItem, targetItem, threshold);
        }
        // Rectangle/Polygon to Rectangle/Polygon snapping
        else if (
            (isRectangle(activeItem) || isPolygon(activeItem)) &&
            (isRectangle(targetItem) || isPolygon(targetItem))
        ) {
            snapPosition = snapRectToRect(activeItem, targetItem, threshold);
        }

        // Track the closest snap
        if (snapPosition) {
            const distance = activeItem.position.getDistance(snapPosition);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestSnapPosition = snapPosition;
            }
        }
    }

    return bestSnapPosition;
};
