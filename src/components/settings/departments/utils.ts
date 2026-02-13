import { Department, FlattenedItem } from "./types"
import { arrayMove } from "@dnd-kit/sortable"

export function flatten(
  items: Department[],
  parentId: string | null = null,
  depth = 0
): FlattenedItem[] {
  return items.reduce<FlattenedItem[]>((acc, item, index) => {
    return [
      ...acc,
      { ...item, parentId, depth, index },
      ...flatten(item.children, item.id, depth + 1),
    ]
  }, [])
}

export function findItem(items: Department[], itemId: string) {
  return items.find(({ id }) => id === itemId)
}

export function buildTree(flattenedItems: FlattenedItem[]): Department[] {
  const root: Department = { id: 'root', children: [], name: 'root', type: 'default' }
  const nodes: Record<string, Department> = { [root.id]: root }
  const items = flattenedItems.map((item) => ({ ...item, children: [] }))

  for (const item of items) {
    const { id, children, ...rest } = item
    const parentId = item.parentId ?? 'root'
    const parent = nodes[parentId] ?? root
    
    nodes[id] = { ...rest, id, children }
    parent.children.push(nodes[id])
  }

  return root.children
}

export function removeChildrenOf(items: FlattenedItem[], ids: string[]) {
  const excludeParentIds = [...ids]

  return items.filter((item) => {
    if (item.parentId && excludeParentIds.includes(item.parentId)) {
      if (item.children.length) {
        excludeParentIds.push(item.id)
      }
      return false
    }

    return true
  })
}

export function getProjection(
  items: FlattenedItem[],
  activeId: string,
  overId: string,
  dragOffset: number,
  indentationWidth: number
) {
  const overItemIndex = items.findIndex(({ id }) => id === overId)
  const activeItemIndex = items.findIndex(({ id }) => id === activeId)
  const activeItem = items[activeItemIndex]
  
  const newItems = arrayMove(items, activeItemIndex, overItemIndex)
  const previousItem = newItems[overItemIndex - 1]
  const nextItem = newItems[overItemIndex + 1]
  
  const dragDepth = Math.round(dragOffset / indentationWidth)
  const projectedDepth = activeItem.depth + dragDepth
  
  // Enforce max depth of 1 (Parent -> Child only)
  let maxDepth = previousItem ? previousItem.depth + 1 : 0
  if (maxDepth > 1) {
    maxDepth = 1
  }

  const minDepth = nextItem ? nextItem.depth : 0
  
  let depth = projectedDepth
  if (depth >= maxDepth) {
    depth = maxDepth
  } else if (depth < minDepth) {
    depth = minDepth
  }
  
  let parentId: string | null = null
  if (depth === 0) {
    parentId = null
  } else {
    const previousSibling = newItems.slice(0, overItemIndex).reverse().find((item) => item.depth === depth - 1)
    parentId = previousSibling?.id ?? null
  }
  
  return { depth, maxDepth, minDepth, parentId }
}
