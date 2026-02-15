import { Box, HStack, Text, Grid, Collapsible, IconButton, Badge } from "@chakra-ui/react"
import { LuChevronDown } from "react-icons/lu"
import { useState } from "react"
import { Employee } from "@/types"
import { EmployeeCard } from "./EmployeeCard"
import { DepartmentConfig } from "@/lib/departments"

interface DepartmentGroupProps {
  department: DepartmentConfig
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
  const [isOpen, setIsOpen] = useState(true)

  if (employees.length === 0) return null

  // Group employees by sub-department if applicable, or just list them
  // For simplicity in this iteration, we list them all but sort by sub-department
  const sortedEmployees = [...employees].sort((a, b) => a.department.localeCompare(b.department))

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
            aria-label="Toggle" 
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
            <Grid templateColumns="1fr" gap="2" animation="fade-in 0.3s">
              {sortedEmployees.map(emp => (
                <EmployeeCard
                  key={emp.id}
                  employee={emp}
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
        </Collapsible.Content>
      </Box>
    </Collapsible.Root>
  )
}
