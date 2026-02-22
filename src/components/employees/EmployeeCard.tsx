import { Box, HStack, Text, Badge, IconButton, Grid, GridItem } from "@chakra-ui/react"
import { Employee } from "@/types"
import { LuEllipsis, LuPencil, LuArchive, LuUndo, LuTrash2 } from "react-icons/lu"
import { formatCurrency } from "@/lib/utils"
import { getDepartmentColor } from "@/lib/departments"
import { useDepartments } from "@/hooks/useDepartments"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"

interface EmployeeCardProps {
  employee: Employee
  departmentName?: string
  colorPalette?: string
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
  departmentName,
  colorPalette,
  isSelected,
  onSelect,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onClick
}: EmployeeCardProps) => {
  const { t } = useTranslation('employees')
  const { departments: departmentConfig } = useDepartments()
  const finalDepartmentColor = colorPalette || getDepartmentColor(departmentConfig, employee.department)
  const finalDepartmentName = departmentName || t(`departments.${employee.department}`, { defaultValue: employee.department })

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
      _hover={{ shadow: "md", bg: "oxygen.50" }}
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
            <Badge variant="subtle" colorPalette={finalDepartmentColor} size="sm">
              {finalDepartmentName}
            </Badge>
            {employee.grade && (
              <Badge variant="outline" colorPalette={gradeColor} size="sm">
                {t(`grades.${employee.grade.toLowerCase()}`, { defaultValue: employee.grade })}
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

        {/* 5. Status Indicator & Dates */}
        <GridItem>
          {employee.isArchived ? (
            <Box textAlign="right">
              <Badge
                size="sm"
                variant="solid"
                colorPalette="gray"
                mb="1"
              >
                {t('status.archived')}
              </Badge>
              <Text fontSize="xs" color="gray.500">
                Start: {new Date(employee.created).toLocaleDateString()}
              </Text>
              {employee.archiveDate && (
                <Text fontSize="xs" color="gray.500">
                  End: {new Date(employee.archiveDate).toLocaleDateString()}
                </Text>
              )}
            </Box>
          ) : (
            <Badge
              size="sm"
              variant="solid"
              colorPalette="green"
            >
              {t('status.active')}
            </Badge>
          )}
        </GridItem>

        {/* 6. Actions */}
        <GridItem onClick={(e) => e.stopPropagation()}>
          <MenuRoot>
            <MenuTrigger asChild>
              <IconButton variant="ghost" size="xs" aria-label="Actions" color="gray.400" _hover={{ color: "gray.700", bg: "gray.100" }}>
                <LuEllipsis />
              </IconButton>
            </MenuTrigger>
            <MenuContent>
              <MenuItem value="edit" onClick={onEdit}>
                <LuPencil /> {t('actions.edit')}
              </MenuItem>
              {employee.isArchived ? (
                <>
                  <MenuItem value="restore" onClick={onRestore}>
                    <LuUndo /> {t('actions.restore')}
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem value="delete" color="red.500" onClick={onDelete}>
                    <LuTrash2 /> {t('actions.delete')}
                  </MenuItem>
                </>
              ) : (
                <MenuItem value="archive" color="red.500" onClick={onArchive}>
                  <LuArchive /> {t('actions.archive')}
                </MenuItem>
              )}
            </MenuContent>
          </MenuRoot>
        </GridItem>

      </Grid>
    </Box>
  )
}
