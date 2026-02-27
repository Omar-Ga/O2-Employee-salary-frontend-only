import { Box, Text, Icon, IconButton, Flex, Input } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuChevronDown, LuChevronRight, LuTrash2 } from "react-icons/lu"
import { NodeRendererProps } from "react-arborist"
import { DepartmentNode } from "./types"
import { useRef, useEffect } from "react"

const DEPARTMENT_COLORS = [
  "blue", "purple", "cyan", "teal", "green", "orange", "pink", "red"
]

export const DepartmentItem = ({
  node,
  style
}: NodeRendererProps<DepartmentNode>) => {
  const { t } = useTranslation('departments')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (node.isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [node.isEditing])

  const handleBlur = () => {
    if (inputRef.current) {
      const newValue = inputRef.current.value.trim()
      if (newValue && newValue !== node.data.name) {
        node.submit(newValue)
      } else {
        node.reset()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      node.reset()
    }
  }

  const isParent = node.level === 0
  const hasChildren = !node.isLeaf

  // Assign a static color based on the parent's index for visual grouping
  const rootIndex = isParent ? node.childIndex : (node.parent?.childIndex || 0)
  const accentColor = DEPARTMENT_COLORS[rootIndex % DEPARTMENT_COLORS.length]

  return (
    <Box style={style} px={2}>
      <Flex
        bg={node.isSelected ? "oxygen.50" : (isParent ? "white" : "gray.50")}
        py={isParent ? "10px" : "7px"}
        px={3}
        borderRadius="md"
        border="1px solid"
        borderColor={node.isSelected ? "oxygen.300" : "gray.200"}
        borderLeftWidth={node.isSelected ? "3px" : (isParent ? "3px" : "1px")}
        borderLeftColor={node.isSelected ? "oxygen.500" : (isParent ? `${accentColor}.500` : "gray.200")}
        boxShadow={isParent ? "sm" : "none"}
        _hover={{ borderColor: `${accentColor}.300`, boxShadow: "sm", bg: "white" }}
        align="center"
        gap={2}
        transition="all 0.1s"
        onDoubleClick={() => node.edit()}
        onClick={() => node.select()}
      >
        {/* Name */}
        {node.isEditing ? (
          <Input
            ref={inputRef}
            size="sm"
            defaultValue={node.data.name}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            variant="outline"
            bg="white"
            h="24px"
            flex={1}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <Text
            fontWeight={isParent ? "semibold" : "normal"}
            fontSize="sm"
            color={node.isSelected ? "oxygen.800" : (isParent ? "gray.800" : "gray.600")}
            flex={1}
            lineHeight="1.3"
            userSelect="none"
          >
            {node.data.name}
          </Text>
        )}

        {/* Child count for parents */}
        {hasChildren && (
          <Text fontSize="xs" color="gray.400" mr={1}>
            {node.children?.length || 0}
          </Text>
        )}

        {/* Actions Group */}
        <Flex gap={1} align="center">
          {/* Collapse Action */}
          {hasChildren && (
            <IconButton
              variant="ghost"
              size="xs"
              aria-label={t('actions.toggleCollapse', { defaultValue: 'Toggle collapse' })}
              onClick={(e) => {
                e.stopPropagation()
                node.toggle()
              }}
              color="gray.400"
              _hover={{ bg: "gray.100", color: "gray.600" }}
              minW="auto"
              h="auto"
              p={0.5}
            >
              <Icon as={node.isOpen ? LuChevronDown : LuChevronRight} boxSize={4} />
            </IconButton>
          )}
          {/* Delete Action */}
          <IconButton
            variant="ghost"
            size="xs"
            aria-label={t('actions.delete')}
            onClick={(e) => {
              e.stopPropagation()
              node.tree.delete(node.id)
            }}
            color="gray.400"
            _hover={{ bg: "red.50", color: "red.500" }}
            minW="auto"
            h="auto"
            p={0.5}
          >
            <Icon as={LuTrash2} boxSize={4} />
          </IconButton>
        </Flex>
      </Flex>
    </Box>
  )
}
