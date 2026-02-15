import { Department, FlattenedItem } from "./types"


export const DEPARTMENT_COLORS = [
  "blue", "purple", "cyan", "teal", "green", "orange", "pink", "red"
]

/**
 * Assign a unique color to each root-level department.
 * Colors cycle through the palette but skip any already-used colors.
 */
function assignRootColor(rootIndex: number, usedColors: string[]): string {
  // Try to find an unused color first
  const unused = DEPARTMENT_COLORS.filter(c => !usedColors.includes(c))
  if (unused.length > 0) {
    return unused[rootIndex % unused.length]
  }
  // Fallback: cycle through full palette
  return DEPARTMENT_COLORS[rootIndex % DEPARTMENT_COLORS.length]
}

export function flatten(
  items: Department[],
  parentId: string | null = null,
  depth = 0,
  usedColors: string[] = []
): FlattenedItem[] {
  let rootCounter = 0
  return items.reduce<FlattenedItem[]>((acc, item, index) => {
    let color: string | undefined = undefined

    if (depth === 0) {
      // Root items get a unique color
      color = item.color || assignRootColor(rootCounter, usedColors)
      usedColors.push(color)
      rootCounter++
    }
    // Children: no color assigned (component defaults to gray/silver)

    const flattenedItem: FlattenedItem = {
      id: item.id,
      name: item.name,
      type: item.type,
      parentId,
      depth,
      index,
      collapsed: item.collapsed,
      childCount: item.children.length,
      color
    }

    return [
      ...acc,
      flattenedItem,
      ...flatten(item.children, item.id, depth + 1, usedColors),
    ]
  }, [])
}

export function buildTree(flattenedItems: FlattenedItem[]): Department[] {
  const root: Department = { id: 'root', children: [], name: 'root', type: 'default' }
  const nodes: Record<string, Department> = { [root.id]: root }

  // Create all department nodes first
  for (const item of flattenedItems) {
    const { id, name, type, color, collapsed } = item
    nodes[id] = {
      id,
      name,
      type,
      children: [],
      color,
      collapsed
    }
  }

  // Build hierarchy
  for (const item of flattenedItems) {
    const parentId = item.parentId ?? 'root'
    const parent = nodes[parentId] ?? root
    // Only add if parent exists (avoid orphaned nodes if parent deleted/missing)
    if (parent) {
      parent.children.push(nodes[item.id])
    }
  }

  return root.children
}

/** 
 * Returns true if the item or any of its ancestors are collapsed 
 */
export function isAncestorCollapsed(
  item: FlattenedItem,
  items: FlattenedItem[]
): boolean {
  if (!item.parentId) return false

  let currentParentId: string | null = item.parentId
  while (currentParentId) {
    const parent = items.find(i => i.id === currentParentId)
    if (!parent) break

    if (parent.collapsed) return true
    currentParentId = parent.parentId
  }

  return false
}

export function reorderTree(
  items: FlattenedItem[],
  activeId: string,
  overId: string,
  dragOffset: number,
  indentationWidth: number
): FlattenedItem[] {
  const activeItemIndex = items.findIndex(i => i.id === activeId)
  const overItemIndex = items.findIndex(i => i.id === overId)

  if (activeItemIndex === -1 || overItemIndex === -1) return items

  const activeItem = items[activeItemIndex]

  // Clone items to avoid mutating original array while we work
  const clonedItems = [...items]

  // Find the subtree (item + all its descendants)
  // We need this for both cases (move or just indent)
  let subtreeCount = 1
  for (let i = activeItemIndex + 1; i < clonedItems.length; i++) {
    if (clonedItems[i].depth <= activeItem.depth) break
    subtreeCount++
  }

  const subtree = clonedItems.slice(activeItemIndex, activeItemIndex + subtreeCount)

  // 1. Calculate new depth based on drag offset
  const dragDepth = Math.round(dragOffset / indentationWidth)
  const projectedDepth = activeItem.depth + dragDepth

  // 2. Calculate max allowed depth
  // In a flattened list, the item immediately preceding the active item (or its new position)
  // determines the max depth.

  let previousItem: FlattenedItem | undefined

  if (activeId === overId) {
    // In-place indentation
    previousItem = items[activeItemIndex - 1]
  } else {
    // Moving to a new position
    // We need to simulate the move to know who the predecessor will be.
    // Logic from original implementation for moving:
    const isMovingDown = activeItemIndex < overItemIndex
    let insertIndex = clonedItems.findIndex(i => i.id === overId)
    if (isMovingDown) insertIndex += 1
    else if (projectedDepth > items[overItemIndex].depth) insertIndex += 1

    // Adjust insert index because we will remove the subtree first
    // If moving down, the removal of subtree (which is before insertIndex) shifts everything up.
    // But let's just look at the item at insertIndex - 1 in the *original* list logic? 
    // It's safer to rely on the logic below after splicing.
  }

  // --- CASE A: In-place indentation (same position, just visual depth change) ---
  if (activeId === overId) {
    previousItem = items[activeItemIndex - 1]

    // Max depth logic
    // Max depth is previousItem.depth + 1.
    // Also hard limit of 1 for depths? (As per previous code comments: "Max depth is 1 (parent=0, child=1, no grandchildren)")
    const MAX_ALLOWED_DEPTH = 1
    const maxChildRelativeDepth = subtree.reduce((max, item, i) => {
      if (i === 0) return max
      return Math.max(max, item.depth - activeItem.depth)
    }, 0)

    let maxDepth = previousItem ? previousItem.depth + 1 : 0
    // Enforce global max depth rule
    maxDepth = Math.min(maxDepth, MAX_ALLOWED_DEPTH - maxChildRelativeDepth)
    const minDepth = 0

    let newDepth = projectedDepth
    if (newDepth >= maxDepth) newDepth = maxDepth
    if (newDepth < minDepth) newDepth = minDepth

    if (newDepth === activeItem.depth) return items // No change

    // Apply changes
    const depthDiff = newDepth - activeItem.depth

    // Determine new parent
    let newParentId: string | null = null
    if (newDepth === 0) {
      newParentId = null
    } else {
      // Find nearest predecessor with depth - 1
      const previousSibling = items
        .slice(0, activeItemIndex)
        .reverse()
        .find(item => item.depth === newDepth - 1)
      newParentId = previousSibling?.id ?? null
    }

    // Mutate the cloned items directly (since we didn't splice them out)
    // Update root of subtree
    clonedItems[activeItemIndex] = {
      ...clonedItems[activeItemIndex],
      depth: newDepth,
      parentId: newParentId
    }

    // Update children
    for (let i = 1; i < subtreeCount; i++) {
      const childIndex = activeItemIndex + i
      clonedItems[childIndex] = {
        ...clonedItems[childIndex],
        depth: clonedItems[childIndex].depth + depthDiff
      }
    }

    return clonedItems
  }

  // --- CASE B: Vertical Reordering (Moving to different position) ---

  // Remove subtree from old position
  clonedItems.splice(activeItemIndex, subtreeCount)

  // Calculate insertion point
  let newOverIndex = clonedItems.findIndex(i => i.id === overId)
  const isMovingDown = activeItemIndex < overItemIndex
  const overItem = items[overItemIndex]

  let insertIndex = newOverIndex
  if (isMovingDown) {
    insertIndex += 1
  } else if (projectedDepth > overItem.depth) {
    insertIndex += 1
  }

  // Insert subtree
  clonedItems.splice(insertIndex, 0, ...subtree)

  // Now calculate new depth based on the NEW position
  // The item at insertIndex is our active item.
  // The item at insertIndex - 1 is our new previousSibling.
  const newActiveIndex = insertIndex
  previousItem = clonedItems[newActiveIndex - 1]

  const MAX_ALLOWED_DEPTH = 1
  const maxChildRelativeDepth = subtree.reduce((max, item, i) => {
    if (i === 0) return max
    return Math.max(max, item.depth - activeItem.depth)
  }, 0)

  let maxDepth = previousItem ? previousItem.depth + 1 : 0
  maxDepth = Math.min(maxDepth, MAX_ALLOWED_DEPTH - maxChildRelativeDepth)
  const minDepth = 0

  let newDepth = projectedDepth
  if (newDepth >= maxDepth) newDepth = maxDepth
  if (newDepth < minDepth) newDepth = minDepth

  const depthDiff = newDepth - activeItem.depth

  let newParentId: string | null = null
  if (newDepth === 0) {
    newParentId = null
  } else {
    // Parent is the nearest preceding item with depth === newDepth - 1
    const previousSibling = clonedItems
      .slice(0, newActiveIndex)
      .reverse()
      .find(item => item.depth === newDepth - 1)
    newParentId = previousSibling?.id ?? null
  }

  // Apply updates to the subtree elements in the new array
  clonedItems[newActiveIndex] = {
    ...clonedItems[newActiveIndex],
    depth: newDepth,
    parentId: newParentId
  }

  for (let i = 1; i < subtreeCount; i++) {
    const childIndex = newActiveIndex + i
    clonedItems[childIndex] = {
      ...clonedItems[childIndex],
      depth: clonedItems[childIndex].depth + depthDiff
    }
  }

  return clonedItems
}
