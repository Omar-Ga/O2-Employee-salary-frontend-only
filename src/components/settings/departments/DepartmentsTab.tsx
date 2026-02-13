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
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable"
import { useState, useMemo } from "react"
import { Box, Button, Grid, GridItem, Heading, Text, VStack, Card, Icon } from "@chakra-ui/react"
import { LuSave, LuUndo, LuLayoutGrid } from "react-icons/lu"
import { nanoid } from "nanoid"
import { useTranslation } from "react-i18next"

import { Department, DepartmentType } from "./types"
import { flatten, buildTree, getProjection } from "./utils"
import { DepartmentItem } from "./DepartmentItem"
import { DepartmentPaletteItem } from "./DepartmentPalette"

const INDENTATION_WIDTH = 32

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
}

const INITIAL_DATA: Department[] = [
  {
    id: "d1",
    name: "Management",
    type: "structural",
    children: [
      {
        id: "d2",
        name: "Human Resources",
        type: "functional",
        children: []
      }
    ]
  }
]

export const DepartmentsTab = () => {
  const { t } = useTranslation('departments')
  const [items, setItems] = useState<Department[]>(INITIAL_DATA)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<DepartmentType | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Flatten the tree for rendering
  const flattenedItems = useMemo(() => {
    return flatten(items)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced for faster response
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activeItem = useMemo(() => {
    if (!activeId) return null
    if (activeType) return null
    return flattenedItems.find((item) => item.id === activeId)
  }, [activeId, flattenedItems, activeType])

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    setActiveId(active.id as string)
    
    if (active.data.current?.type === "palette") {
      setActiveType(active.data.current.departmentType)
    } else {
      setActiveType(null)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    
    resetState()

    if (!over) return

    // Case 1: Dragging from Palette
    if (active.data.current?.type === "palette") {
      const newId = nanoid()
      const newDept: Department = {
        id: newId,
        name: t('palette.newItem'), 
        type: 'default',
        children: []
      }
      
      setItems([...items, newDept])
      setHasChanges(true)
      return
    }

    // Case 2: Sorting/Nesting
    const activeItem = flattenedItems.find(({ id }) => id === active.id)
    const overItem = flattenedItems.find(({ id }) => id === over.id)

    if (activeItem && overItem) {
      // Calculate final projection
      const finalProjection = getProjection(
        flattenedItems,
        active.id as string,
        over.id as string,
        (event.delta.x), 
        INDENTATION_WIDTH
      )
      
      const { depth, parentId } = finalProjection
      const overIndex = flattenedItems.findIndex(({ id }) => id === over.id)
      const activeIndex = flattenedItems.findIndex(({ id }) => id === active.id)

      // Clone & Move
      let newFlattened = [...flattenedItems]
      newFlattened = arrayMove(newFlattened, activeIndex, overIndex)
      
      // Update metadata
      const movedItem = newFlattened.find(i => i.id === active.id)
      if (movedItem) {
        movedItem.depth = depth
        movedItem.parentId = parentId
      }

      // Rebuild tree
      const newTree = buildTree(newFlattened)
      setItems(newTree)
      setHasChanges(true)
    }
  }

  function resetState() {
    setActiveId(null)
    setActiveType(null)
  }
  
  function handleSave() {
    console.log("Saving Tree:", items)
    setHasChanges(false)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={resetState}
    >
      <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={8} alignItems="start">
        
        {/* Left: Canvas */}
        <GridItem>
          <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
            <Heading size="md" color="gray.700">{t('title')}</Heading>
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
          
          <Box 
            bg="gray.50" 
            p={6} 
            borderRadius="xl" 
            minH="500px" 
            border="2px dashed" 
            borderColor="gray.200"
            id="canvas-drop-zone"
          >
             <SortableContext items={flattenedItems.map(d => d.id)} strategy={verticalListSortingStrategy}>
               {flattenedItems.map((item) => (
                 <DepartmentItem 
                    key={item.id} 
                    department={item} 
                    depth={item.depth}
                 />
               ))}
               
               {flattenedItems.length === 0 && (
                 <Box 
                   h="full" 
                   display="flex" 
                   alignItems="center" 
                   justifyContent="center" 
                   color="gray.400"
                   flexDir="column"
                   gap={2}
                   mt={20}
                 >
                   <Icon as={LuUndo} boxSize={8} transform="rotate(90deg)" />
                   <Text>{t('emptyState')}</Text>
                 </Box>
               )}
             </SortableContext>
          </Box>
        </GridItem>

        {/* Right: Palette */}
        <GridItem position="sticky" top={4}>
           <Card.Root size="sm" variant="elevated">
             <Card.Header>
               <Heading size="sm">{t('palette.title')}</Heading>
               <Text fontSize="xs" color="gray.500">{t('palette.subtitle')}</Text>
             </Card.Header>
             <Card.Body>
               <VStack gap={4} align="stretch">
                 <DepartmentPaletteItem />
               </VStack>
             </Card.Body>
           </Card.Root>
           
           <Box mt={6} p={4} bg="blue.50" borderRadius="lg">
             <Heading size="xs" color="blue.700" mb={2}>{t('palette.instructions.title')}</Heading>
             <VStack align="start" fontSize="xs" color="blue.600" gap={1}>
               <Text>• {t('palette.instructions.step1')}</Text>
               <Text>• {t('palette.instructions.step2')}</Text>
               <Text>• {t('palette.instructions.step3')}</Text>
             </VStack>
           </Box>
        </GridItem>

      </Grid>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeType ? (
           <Box 
              p={3} 
              bg="white" 
              borderRadius="md" 
              shadow="xl" 
              border="1px solid" 
              borderColor="oxygen.500"
              display="flex"
              alignItems="center"
              gap={3}
              w="250px"
           >
              <Box p={2} bg="oxygen.100" color="oxygen.600" borderRadius="md">
                  <Icon as={LuLayoutGrid} boxSize={4} />
              </Box>
              <Text fontWeight="semibold">{t('palette.newItem')}</Text>
           </Box>
        ) : activeItem ? (
           <DepartmentItem 
              department={activeItem} 
              depth={0} // Overlay is always at 0 visual depth relative to cursor
              isOverlay 
           />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
