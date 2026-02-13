import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Box, Text, Icon, Badge, HStack, Stack } from "@chakra-ui/react"
import { LuGripVertical, LuLayoutGrid } from "react-icons/lu"
import { Department } from "./types"
import { memo } from "react"
import { useTranslation } from "react-i18next"

interface DepartmentItemProps {
  department: Department
  depth?: number
  isOverlay?: boolean
}

export const DepartmentItem = memo(({ department, depth = 0, isOverlay }: DepartmentItemProps) => {
  const { t } = useTranslation('departments')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: department.id, data: { type: "department", department } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    marginLeft: `${depth * 32}px`, // Use 32px to match INDENTATION_WIDTH in parent
    position: "relative" as const,
    zIndex: isDragging ? 999 : "auto",
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      mb={2}
    >
      <Box
        bg={isOverlay ? "white" : "white"}
        p={3}
        borderRadius="md"
        borderWidth="1px"
        borderColor={isDragging ? "oxygen.500" : "gray.200"}
        shadow={isOverlay ? "lg" : "sm"}
        _hover={{ borderColor: "oxygen.400", shadow: "md" }}
        transition="all 0.2s"
        position="relative"
        role="group"
      >
        <HStack gap={3}>
          {/* Drag Handle */}
          <Box 
            {...listeners} 
            cursor="grab" 
            color="gray.400" 
            _hover={{ color: "gray.600" }}
            _active={{ cursor: "grabbing" }}
          >
            <Icon as={LuGripVertical} boxSize={5} />
          </Box>

          {/* Icon */}
          <Box 
            p={2} 
            bg="oxygen.50" 
            color="oxygen.600" 
            borderRadius="md"
          >
            <Icon as={LuLayoutGrid} boxSize={4} />
          </Box>

          {/* Content */}
          <Stack gap={0} flex={1}>
            <Text fontWeight="semibold" fontSize="sm" color="gray.800">
              {department.name}
            </Text>
            {/* Show hierarchy info instead of type */}
            <Text fontSize="xs" color="gray.500">
               {department.children?.length > 0 ? t('item.parentUnit') : t('item.department')}
            </Text>
          </Stack>

          {/* Hierarchy Indicator */}
          {department.children?.length > 0 && (
             <Badge variant="subtle" colorPalette="gray" size="sm">
               {t('item.subUnits', { count: department.children.length })}
             </Badge>
          )}
        </HStack>
      </Box>
      
      {/* Connector Lines for visual hierarchy */}
      {depth > 0 && !isOverlay && (
        <>
          <Box 
            position="absolute"
            left="-32px"
            top="50%"
            width="32px"
            height="1px"
            bg="gray.300"
            zIndex={-1}
          />
           <Box 
            position="absolute"
            left="-32px"
            top="-12px" 
            bottom="50%"
            width="1px"
            bg="gray.300"
            zIndex={-1}
          />
        </>
      )}
    </Box>
  )
})
