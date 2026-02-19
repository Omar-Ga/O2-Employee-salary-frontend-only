import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Box, Text, Icon, IconButton, Flex, Input } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuGripVertical, LuChevronDown, LuChevronRight } from "react-icons/lu"
import { FlattenedItem } from "./types"
import { memo, useState, useRef, useEffect } from "react"

interface DepartmentItemProps {
  department: FlattenedItem
  depth?: number
  isOverlay?: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onRename?: (newName: string) => void
  color?: string
}

export const DepartmentItem = memo(({
  department,
  depth = 0,
  isOverlay,
  isCollapsed,
  onToggleCollapse,
  onRename,
  color = "gray"
}: DepartmentItemProps) => {
  const { t } = useTranslation('departments')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(department.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: department.id,
    data: { type: "department", department },
    disabled: isEditing
  })

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isOverlay) return
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editValue.trim() && editValue !== department.name) {
      onRename?.(editValue.trim())
    } else {
      setEditValue(department.name)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setEditValue(department.name)
      setIsEditing(false)
    }
  }

  const isParent = depth === 0
  // Parents get their unique color; children are always silver/gray
  const accentColor = isParent ? color : "gray"

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    marginLeft: depth === 0 ? 0 : `${depth * 28}px`,
    position: "relative" as const,
    zIndex: isDragging ? 999 : "auto",
    marginBottom: "4px",
  }

  const hasChildren = department.childCount > 0

  return (
    <Box ref={setNodeRef} style={style} {...attributes}>
      <Flex
        bg={isParent ? "white" : "gray.50"}
        py={isParent ? "10px" : "7px"}
        px={3}
        borderRadius="md"
        border="1px solid"
        borderColor={isDragging ? `${accentColor}.400` : (isParent ? "gray.200" : "gray.200")}
        borderLeftWidth="3px"
        borderLeftColor={`${accentColor}.${isParent ? '500' : '200'}`}
        boxShadow={isDragging ? "md" : (isParent ? "sm" : "none")}
        _hover={{ borderColor: `${accentColor}.300`, boxShadow: "sm" }}
        align="center"
        gap={2}
        transition="all 0.15s"
        onDoubleClick={handleDoubleClick}
      >
        {/* Drag Handle */}
        <Box
          {...listeners}
          cursor="grab"
          color="gray.400"
          _hover={{ color: "gray.600" }}
          _active={{ cursor: "grabbing" }}
          display="flex"
          alignItems="center"
        >
          <Icon as={LuGripVertical} boxSize={4} />
        </Box>

        {/* Name */}
        {isEditing ? (
          <Input
            ref={inputRef}
            size="sm"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            variant="outline"
            bg="white"
            h="24px"
            flex={1}
            autoFocus
          />
        ) : (
          <Text
            fontWeight={isParent ? "semibold" : "normal"}
            fontSize="sm"
            color={isParent ? "gray.800" : "gray.600"}
            flex={1}
            lineHeight="1.3"
            userSelect="none"
          >
            {department.name}
          </Text>
        )}

        {/* Child count for parents */}
        {hasChildren && (
          <Text fontSize="xs" color="gray.400" mr={1}>
            {department.childCount}
          </Text>
        )}

        {/* Actions Group */}
        <Flex gap={1} align="center">


          {/* Collapse Action */}
          {hasChildren && !isOverlay && (
            <IconButton
              variant="ghost"
              size="xs"
              aria-label={t('actions.toggleCollapse', { defaultValue: 'Toggle collapse' })}
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapse?.()
              }}
              color="gray.400"
              _hover={{ bg: "gray.100", color: "gray.600" }}
              minW="auto"
              h="auto"
              p={0.5}
            >
              <Icon as={isCollapsed ? LuChevronRight : LuChevronDown} boxSize={4} />
            </IconButton>
          )}
        </Flex>
      </Flex>
    </Box>
  )
})
