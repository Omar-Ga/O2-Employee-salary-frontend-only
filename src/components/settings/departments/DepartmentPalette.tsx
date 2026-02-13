import { useDraggable } from "@dnd-kit/core"
import { Box, Text, Icon, Stack, Badge } from "@chakra-ui/react"
import { LuLayoutGrid } from "react-icons/lu"
import { useTranslation } from "react-i18next"

export const DepartmentPaletteItem = () => {
  const { t } = useTranslation('departments')
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "palette-new-dept",
    data: { type: "palette", departmentType: "default", label: t('palette.newItem') },
  })

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      cursor="grab"
      p={4}
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.200"
      borderStyle="dashed"
      _hover={{ 
        borderColor: "oxygen.400", 
        bg: "oxygen.50",
        transform: "translateY(-2px)",
        shadow: "md"
      }}
      transition="all 0.2s"
      opacity={isDragging ? 0.5 : 1}
    >
      <Stack align="center" gap={3}>
        <Box 
          p={3} 
          bg="oxygen.100" 
          color="oxygen.600" 
          borderRadius="full"
        >
          <Icon as={LuLayoutGrid} boxSize={6} />
        </Box>
        <Stack gap={0} textAlign="center">
           <Text fontWeight="bold" fontSize="sm" color="gray.700">
             {t('palette.newItem')}
           </Text>
           <Badge variant="surface" colorPalette="green" size="xs">
             {t('palette.dragToAdd')}
           </Badge>
        </Stack>
      </Stack>
    </Box>
  )
}
