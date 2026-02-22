import { Box, HStack, Text, Grid, Collapsible, IconButton, Badge } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuChevronDown } from "react-icons/lu"
import { useState } from "react"
import { Employee } from "@/types"
import { EmployeeCard } from "./EmployeeCard"

interface DepartmentGroupProps {
  department: { id: string; label: string; colorPalette?: string; subDepartments: { id: string; label: string }[] }
  employees: Employee[]
  selectedIds: string[]
  onSelectEmployee: (id: string, checked: boolean) => void
  onAction: (action: string, id: string) => void
}

export const DepartmentGroup = ({
  department,
  employees,
  selectedIds,
  onSelectEmployee,
  onAction
}: DepartmentGroupProps) => {
  const { t } = useTranslation('employees')
  const [isOpen, setIsOpen] = useState(true)

  if (employees.length === 0) return null

  const subDeptGroups: { id: string; label: string; employees: Employee[] }[] = []

  department.subDepartments.forEach(sub => {
    const subEmps = employees.filter(e => e.department === sub.id)
    if (subEmps.length > 0) {
      subDeptGroups.push({ id: sub.id, label: sub.label, employees: subEmps })
    }
  })

  // Catch any employees that don't match known sub-departments (e.g., if parent is 'other' or misassigned)
  const otherEmps = employees.filter(e => !department.subDepartments.some(sub => sub.id === e.department))
  if (otherEmps.length > 0) {
    subDeptGroups.push({ id: 'other', label: t('tabs.other_sub', { defaultValue: 'Other' }), employees: otherEmps })
  }

  return (
    <Collapsible.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Box mb="2">
        {/* Header */}
        <HStack
          cursor="pointer"
          onClick={() => setIsOpen(!isOpen)}
          mb="2"
          _hover={{ bg: "gray.50" }}
          p="1"
          borderRadius="md"
          transition="background 0.2s"
        >
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={t('actions.toggle', { defaultValue: 'Toggle' })}
            transform={isOpen ? "rotate(0deg)" : "rotate(-90deg)"}
            transition="transform 0.2s"
            pointerEvents="none" // Click passes to parent HStack
          >
            <LuChevronDown />
          </IconButton>

          <Text fontSize="lg" fontWeight="bold" color="gray.700">
            {department.label}
          </Text>

          <Badge colorPalette={department.colorPalette || "gray"} variant="solid" borderRadius="full" px="2">
            {employees.length}
          </Badge>

          <Box flex="1" h="1px" bg="gray.100" ml="4" />
        </HStack>

        {/* Content */}
        <Collapsible.Content>
          <Box animation="fade-in 0.3s">
            {subDeptGroups.map((group, index) => (
              <Box key={group.id} mb={index < subDeptGroups.length - 1 ? 4 : 0}>
                {department.id !== 'other' && (
                  <HStack mb="2" ml="8">
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                      {group.label}
                    </Text>
                    <Box flex="1" h="1px" bg="gray.100" ml="2" />
                  </HStack>
                )}
                <Grid templateColumns="1fr" gap="2" ml={department.id !== 'other' ? "8" : "0"}>
                  {group.employees.map(emp => (
                    <EmployeeCard
                      key={emp.id}
                      employee={emp}
                      departmentName={group.label}
                      colorPalette={department.colorPalette || "gray"}
                      isSelected={selectedIds.includes(emp.id)}
                      onSelect={(c) => onSelectEmployee(emp.id, c)}
                      onEdit={() => onAction('edit', emp.id)}
                      onArchive={() => onAction('archive', emp.id)}
                      onRestore={() => onAction('restore', emp.id)}
                      onDelete={() => onAction('delete', emp.id)}
                      onClick={() => onAction('transaction', emp.id)}
                    />
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        </Collapsible.Content>
      </Box>
    </Collapsible.Root>
  )
}
