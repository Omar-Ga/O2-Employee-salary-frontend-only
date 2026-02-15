import { Box, HStack, Text, Badge, IconButton, Menu, Grid, GridItem } from "@chakra-ui/react"
import { Employee } from "@/types"
import { LuEllipsis, LuPencil, LuArchive, LuUndo, LuTrash2 } from "react-icons/lu"
import { formatCurrency } from "@/lib/utils"
import { getDepartmentColor } from "@/lib/departments"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"

interface EmployeeCardProps {
  employee: Employee
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onEdit: () => void
  onArchive: () => void
  onRestore: () => void
  onDelete: () => void
  onClick?: () => void
}

export const EmployeeCard = ({ 
  employee, 
  isSelected, 
  onSelect, 
  onEdit, 
  onArchive, 
  onRestore, 
  onDelete,
  onClick
}: EmployeeCardProps) => {
  const { t } = useTranslation('employees')
  const departmentColor = getDepartmentColor(employee.department)

  const gradeColor = {
    'Excellent': 'green',
    'Good': 'blue',
    'Bad': 'red'
  }[employee.grade || 'Good'] || 'gray'

  return (
    <Box 
      bg="white" 
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor={isSelected ? "oxygen.500" : "gray.200"}
      shadow={isSelected ? "md" : "sm"}
      transition="all 0.2s"
      _hover={{ shadow: "md", borderColor: "oxygen.500", transform: "translateY(-1px)" }}
      position="relative"
      overflow="hidden"
      py="2"
      px="3"
      onClick={onClick}
      cursor="pointer"
    >
      <Grid templateColumns={{ base: "auto 1fr auto", md: "auto 250px 1fr 1fr auto auto" }} gap="4" alignItems="center">
        
        {/* 1. Checkbox */}
        <GridItem onClick={(e) => e.stopPropagation()}>
            <Checkbox 
                checked={isSelected} 
                onCheckedChange={(e) => onSelect(!!e.checked)} 
                size="md"
                colorPalette="oxygen"
            />
        </GridItem>

        {/* 2. Name & Title */}
        <GridItem>
            <Box>
                <Text fontWeight="bold" fontSize="sm">{employee.name}</Text>
                <Text fontSize="xs" color="gray.500">{employee.jobTitle}</Text>
            </Box>
        </GridItem>

        {/* 3. Department & Grade */}
        <GridItem display={{ base: "none", md: "block" }}>
             <HStack gap="2">
                 <Badge variant="subtle" colorPalette={departmentColor} size="sm">
                   {employee.department}
                 </Badge>
                 {employee.grade && (
                   <Badge variant="outline" colorPalette={gradeColor} size="sm">
                     {employee.grade}
                   </Badge>
                 )}
             </HStack>
        </GridItem>

        {/* 4. Salary */}
        <GridItem display={{ base: "none", md: "block" }}>
            <Text fontWeight="semibold" color="gray.700" fontSize="sm">
             {formatCurrency(employee.monthlySalary)}
           </Text>
        </GridItem>

        {/* 5. Status Indicator */}
        <GridItem>
             <Badge 
                size="sm" 
                variant="solid" 
                colorPalette={employee.isArchived ? "gray" : "green"}
             >
                 {employee.isArchived ? "Archived" : "Active"}
             </Badge>
        </GridItem>

        {/* 6. Actions */}
        <GridItem onClick={(e) => e.stopPropagation()}>
            <Menu.Root>
            <Menu.Trigger asChild>
                <IconButton variant="ghost" size="xs" aria-label="Actions" color="gray.400" _hover={{ color: "gray.700", bg: "gray.100" }}>
                <LuEllipsis />
                </IconButton>
            </Menu.Trigger>
            <Menu.Positioner>
                <Menu.Content>
                <Menu.Item value="edit" onClick={onEdit}>
                    <LuPencil /> {t('actions.edit')}
                </Menu.Item>
                {employee.isArchived ? (
                    <>
                    <Menu.Item value="restore" onClick={onRestore}>
                        <LuUndo /> {t('actions.restore')}
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item value="delete" color="red.500" onClick={onDelete}>
                        <LuTrash2 /> {t('actions.delete')}
                    </Menu.Item>
                    </>
                ) : (
                    <Menu.Item value="archive" color="red.500" onClick={onArchive}>
                    <LuArchive /> {t('actions.archive')}
                    </Menu.Item>
                )}
                </Menu.Content>
            </Menu.Positioner>
            </Menu.Root>
        </GridItem>

      </Grid>
    </Box>
  )
}
