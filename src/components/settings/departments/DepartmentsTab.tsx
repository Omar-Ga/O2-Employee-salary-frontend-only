import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  MeasuringStrategy,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { useState, useMemo } from "react"
import { Box, Button, Heading, Text, Icon } from "@chakra-ui/react"

import { LuSave, LuFolderOpen, LuPlus } from "react-icons/lu"
import { nanoid } from "nanoid"
import { useTranslation } from "react-i18next"

import { Department } from "./types"
import { flatten, buildTree, reorderTree, isAncestorCollapsed } from "./utils"
import { DepartmentItem } from "./DepartmentItem"
import { DeleteDropZone } from "./DeleteDropZone"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"


const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: { opacity: '0.5' },
    },
  }),
}

const INITIAL_DATA: Department[] = []

export const DepartmentsTab = () => {
  const { t } = useTranslation('departments')
  const [items, setItems] = useState<Department[]>(INITIAL_DATA)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const fullFlattenedItems = useMemo(() => {
    return flatten(items)
  }, [items])

  const visibleItems = useMemo(() => {
    return fullFlattenedItems.filter((item) => {
      // Check if the item itself or any of its ancestors are collapsed
      return !isAncestorCollapsed(item, fullFlattenedItems)
    })
  }, [fullFlattenedItems])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activeItem = useMemo(() => {
    if (!activeId) return null
    return fullFlattenedItems.find((item) => item.id === activeId)
  }, [activeId, fullFlattenedItems])

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    setActiveId(active.id as string)
  }

  function handleAddDepartment() {
    const newId = nanoid()
    const newDept: Department = {
      id: newId,
      name: "New Department",
      type: 'default',
      children: [],
      collapsed: false
    }
    setItems([...items, newDept])
    setHasChanges(true)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    resetState()

    if (!over) return

    // If dragging over itself, checking if we need to update indentation
    if (active.id === over.id) {
      const dragOffset = (active.rect.current.translated?.left ?? 0) - (active.rect.current.initial?.left ?? 0)

      // Only process if there's a significant horizontal movement (e.g. > 10px)
      // and we are not just clicking.
      if (Math.abs(dragOffset) > 10) {
        const newFlattened = reorderTree(
          fullFlattenedItems,
          active.id as string,
          over.id as string,
          dragOffset,
          28 // indentation width
        )

        // Only update if something actually changed
        if (JSON.stringify(newFlattened) !== JSON.stringify(fullFlattenedItems)) {
          setItems(buildTree(newFlattened))
          setHasChanges(true)
        }
      }
      return
    }

    if (active.id !== over.id) {
      // Check for delete zone drop
      if (over.id === 'delete-zone') {
        const itemToDelete = fullFlattenedItems.find(i => i.id === active.id)
        if (!itemToDelete) return

        if (itemToDelete.childCount > 0) {
          // Parent with children: ask for confirmation
          setPendingDeleteId(active.id as string)
          setIsDeleteDialogOpen(true)
        } else {
          // No children: delete immediately
          handleDeleteDepartment(active.id as string)
        }
        return
      }

      const dragOffset = (active.rect.current.translated?.left ?? 0) - (active.rect.current.initial?.left ?? 0)

      const newFlattened = reorderTree(
        fullFlattenedItems,
        active.id as string,
        over.id as string,
        dragOffset,
        24
      )

      setItems(buildTree(newFlattened))
      setHasChanges(true)
    }
  }

  function resetState() {
    setActiveId(null)
  }

  function handleToggleCollapse(id: string) {
    setItems(prevItems => {
      const toggleInTree = (nodes: Department[]): Department[] => {
        return nodes.map(node => {
          if (node.id === id) {
            return { ...node, collapsed: !node.collapsed }
          }
          if (node.children.length > 0) {
            return { ...node, children: toggleInTree(node.children) }
          }
          return node
        })
      }
      return toggleInTree(prevItems)
    })
  }

  function handleExpandAll() {
    setItems(prevItems => {
      const expandTree = (nodes: Department[]): Department[] => {
        return nodes.map(node => ({
          ...node,
          collapsed: false,
          children: expandTree(node.children)
        }))
      }
      return expandTree(prevItems)
    })
  }

  function handleCollapseAll() {
    setItems(prevItems => {
      const collapseTree = (nodes: Department[]): Department[] => {
        return nodes.map(node => ({
          ...node,
          collapsed: true,
          children: collapseTree(node.children)
        }))
      }
      return collapseTree(prevItems)
    })
  }

  function handleSave() {
    setHasChanges(false)
  }

  function handleDeleteDepartment(id: string) {
    setItems(prevItems => {
      const deleteFromTree = (nodes: Department[]): Department[] => {
        return nodes
          .filter(node => node.id !== id)
          .map(node => ({
            ...node,
            children: deleteFromTree(node.children)
          }))
      }
      return deleteFromTree(prevItems)
    })
    setHasChanges(true)
  }

  function handleConfirmDeleteWithChildren() {
    if (pendingDeleteId) {
      handleDeleteDepartment(pendingDeleteId)
      setPendingDeleteId(null)
      setIsDeleteDialogOpen(false)
    }
  }

  function handlePromoteChildrenThenDelete() {
    if (!pendingDeleteId) return

    setItems(prevItems => {
      // 1. Find the node to delete and get its children
      let childrenToPromote: Department[] = []

      const findAndGetChildren = (nodes: Department[]): Department | null => {
        for (const node of nodes) {
          if (node.id === pendingDeleteId) {
            return node
          }
          const found = findAndGetChildren(node.children)
          if (found) return found
        }
        return null
      }

      const nodeToDelete = findAndGetChildren(prevItems)
      if (nodeToDelete) {
        childrenToPromote = [...nodeToDelete.children]
      }

      // 2. Remove the node
      const deleteFromTree = (nodes: Department[]): Department[] => {
        return nodes
          .filter(node => node.id !== pendingDeleteId)
          .map(node => ({
            ...node,
            children: deleteFromTree(node.children)
          }))
      }

      const newItems = deleteFromTree(prevItems)

      // 3. Append children to the root level (or we could try to put them in place of parent, 
      // but "converted all into parent depts" usually implies moving to root level
      // like "ungrouping")
      return [...newItems, ...childrenToPromote]
    })

    setHasChanges(true)
    setPendingDeleteId(null)
    setIsDeleteDialogOpen(false)
  }

  function handleRenameDepartment(id: string, newName: string) {
    setItems(prevItems => {
      const renameInTree = (nodes: Department[]): Department[] => {
        return nodes.map(node => {
          if (node.id === id) {
            return { ...node, name: newName }
          }
          return {
            ...node,
            children: renameInTree(node.children)
          }
        })
      }
      return renameInTree(prevItems)
    })
    setHasChanges(true)
  }

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: 'root-droppable-zone',
  })

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={resetState}
    >

      <Box>
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Heading size="md" color="gray.700">{t('title')}</Heading>
            <Text fontSize="sm" color="gray.500">{t('subtitle')}</Text>
          </Box>
          <Box display="flex" gap={2}>
            <Button size="xs" variant="outline" onClick={handleExpandAll}>{t('actions.expandAll')}</Button>
            <Button size="xs" variant="outline" onClick={handleCollapseAll}>{t('actions.collapseAll')}</Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddDepartment}
            >
              <Icon as={LuPlus} mr={1} />
              {t('actions.addDepartment')}
            </Button>
            <Button
              size="sm"
              colorPalette="oxygen"
              disabled={!hasChanges}
              onClick={handleSave}
            >
              <Icon as={LuSave} mr={1} />
              {t('save')}
            </Button>
          </Box>
        </Box>

        <Box
          ref={setDroppableRef}
          bg="gray.50"
          p={6}
          borderRadius="xl"
          minH="600px"
          border="1px dashed"
          borderColor="gray.300"
          id="canvas-drop-zone"
        >
          <SortableContext items={visibleItems.map(d => d.id)} strategy={verticalListSortingStrategy}>
            {visibleItems.map((item) => (
              <DepartmentItem
                key={item.id}
                department={item}
                depth={item.depth}
                color={item.color}
                isCollapsed={item.collapsed}
                onToggleCollapse={() => handleToggleCollapse(item.id)}
                onRename={(newName) => handleRenameDepartment(item.id, newName)}
              />
            ))}

            {visibleItems.length === 0 && (
              <Box
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="gray.400"
                flexDir="column"
                gap={2}
                mt={20}
                cursor="pointer"
                onClick={handleAddDepartment}
              >
                <Icon as={LuFolderOpen} boxSize={10} color="gray.300" />
                <Text fontWeight="medium">{t('emptyState.title')}</Text>
                <Text fontSize="sm">{t('emptyState.subtitle')}</Text>
              </Box>
            )}
          </SortableContext>
          <DeleteDropZone isActive={!!activeId} />
        </Box>
      </Box>

      <DialogRoot open={isDeleteDialogOpen} onOpenChange={(e) => setIsDeleteDialogOpen(e.open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              {t('deleteDialog.description')}
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('deleteDialog.cancel')}
            </Button>
            <Button colorPalette="blue" onClick={handlePromoteChildrenThenDelete}>
              {t('deleteDialog.keepChildren')}
            </Button>
            <Button colorPalette="red" onClick={handleConfirmDeleteWithChildren}>
              {t('deleteDialog.deleteAll')}
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeItem ? (
          <DepartmentItem
            department={activeItem}
            depth={0}
            color={activeItem.color}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
