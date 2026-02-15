import { useDroppable } from "@dnd-kit/core"
import { Box, Icon, Text, Flex } from "@chakra-ui/react"
import { LuTrash2 } from "react-icons/lu"
import { useTranslation } from "react-i18next"

export const DeleteDropZone = ({ isActive }: { isActive: boolean }) => {
    const { t } = useTranslation('departments')
    const { setNodeRef, isOver } = useDroppable({
        id: 'delete-zone',
        data: { type: 'delete-zone' }
    })

    // Only show when dragging happens
    if (!isActive) return null

    return (
        <Box
            ref={setNodeRef}
            mt={4}
            p={6}
            borderRadius="xl"
            borderWidth="2px"
            borderStyle="dashed"
            borderColor={isOver ? "red.500" : "red.200"}
            bg={isOver ? "red.50" : "transparent"}
            color={isOver ? "red.600" : "red.400"}
            transition="all 0.2s"
            transform={isOver ? "scale(1.02)" : "scale(1)"}
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Flex direction="column" align="center" gap={2}>
                <Icon as={LuTrash2} boxSize={8} />
                <Text fontWeight="medium" fontSize="sm">
                    {isOver ? t('dropToDelete', 'Drop here to delete') : t('dragToDelete', 'Drag here to delete')}
                </Text>
            </Flex>
        </Box>
    )
}
