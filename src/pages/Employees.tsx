import { Box, Button, HStack, Heading, Input, createListCollection, Separator, Portal, VStack, Stack, Text, IconButton } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { employeeService } from "@/services/employee.service"
import { LuPlus, LuSearch, LuX } from "react-icons/lu"
import { useState, useMemo } from "react"
import { toaster } from "@/components/ui/toaster"
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { InputGroup } from "@/components/ui/input-group"
import { Select } from "@chakra-ui/react"
import { DEPARTMENT_CONFIG, getParentDepartment } from "@/lib/departments"
import { DepartmentGroup } from "@/components/employees/DepartmentGroup"
import { Employee } from "@/types"
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer"
import { AddEmployeeForm } from "@/components/employees/AddEmployeeForm"

export const Employees = () => {
  const { t } = useTranslation(['employees', 'sidebar'])
  const [employees, setEmployees] = useState(employeeService.getAll())
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  // View State
  const [viewMode, setViewMode] = useState<"active" | "archived">("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([])

  // Selection State
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [transactionEmployeeIds, setTransactionEmployeeIds] = useState<string[]>([])
  const [isTransactionDrawerOpen, setIsTransactionDrawerOpen] = useState(false)

  // Filter Logic
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      // 1. Status Filter
      const statusMatch = viewMode === 'archived' ? e.isArchived : !e.isArchived
      if (!statusMatch) return false

      // 2. Search Filter
      const searchLower = searchQuery.toLowerCase()
      const searchMatch = !searchQuery || 
        e.name.toLowerCase().includes(searchLower) ||
        e.email.toLowerCase().includes(searchLower) ||
        e.jobTitle.toLowerCase().includes(searchLower)
      if (!searchMatch) return false

      // 3. Department Filter
      // If no filter selected, show all.
      // If filter selected, check if employee's department (sub-dept) is in the selection 
      // OR if the employee belongs to a main department that is selected.
      if (departmentFilter.length > 0) {
        // Our select returns sub-department IDs.
        return departmentFilter.includes(e.department)
      }

      return true
    })
  }, [employees, viewMode, searchQuery, departmentFilter])

  // Grouping Logic
  const groupedEmployees = useMemo(() => {
    const groups = new Map<string, Employee[]>()
    
    // Initialize groups from config to ensure order
    DEPARTMENT_CONFIG.forEach(d => groups.set(d.id, []))
    // Add an "Other" group for unmapped departments
    groups.set('other', [])

    filteredEmployees.forEach(e => {
      const parent = getParentDepartment(e.department)
      const groupId = parent ? parent.id : 'other'
      const group = groups.get(groupId)
      if (group) group.push(e)
    })

    return groups
  }, [filteredEmployees])

  // Handlers
  const handleAction = (action: string, id: string) => {
    if (action === 'archive') {
      employeeService.softDelete(id)
      toaster.create({ title: t('toast.archived'), type: "success" })
    } else if (action === 'restore') {
        const emp = employees.find(e => e.id === id)
        if (emp) {
            emp.isArchived = false
            employeeService.update(id, emp)
            toaster.create({ title: t('toast.restored'), type: "success" })
        }
    } else if (action === 'delete') {
      // Hard delete not implemented in service yet, maybe just archive?
      // For now let's just log or ignore
      console.log("Delete not fully implemented")
    } else if (action === 'transaction') {
        setTransactionEmployeeIds([id])
        setIsTransactionDrawerOpen(true)
    }
    setEmployees(employeeService.getAll())
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(prev => [...prev, id])
    } else {
      setSelectedEmployeeIds(prev => prev.filter(eid => eid !== id))
    }
  }

  // Filter Collection
  const filterCollection = useMemo(() => {
     const items = DEPARTMENT_CONFIG.flatMap(dept => 
        dept.subDepartments.map(sub => ({
            label: sub.label,
            value: sub.id,
            group: dept.label
        }))
    )
    return createListCollection({ items })
  }, [])
  
  // Group items for rendering in Filter Select
  const filterGroups = useMemo(() => {
      const groups: Record<string, any[]> = {}
      filterCollection.items.forEach(item => {
          if (!groups[item.group]) groups[item.group] = []
          groups[item.group].push(item)
      })
      return Object.entries(groups)
  }, [filterCollection])


  return (
    <Box spaceY="6">
      {/* 1. Top Bar: Header & Controls */}
      <HStack justify="space-between" wrap="wrap" gap="4">
        <HStack gap="4">
           <Heading size="xl">{t('sidebar:items.employees')}</Heading>
           
           <Box bg="gray.100" p="1" borderRadius="lg" display="inline-flex">
              <Button 
                size="xs" 
                variant={viewMode === 'active' ? 'solid' : 'ghost'} 
                colorPalette={viewMode === 'active' ? 'white' : 'gray'}
                bg={viewMode === 'active' ? 'white' : 'transparent'}
                color={viewMode === 'active' ? 'black' : 'gray.500'}
                shadow={viewMode === 'active' ? 'sm' : 'none'}
                onClick={() => setViewMode('active')}
                borderRadius="md"
                px="3"
              >
                {t('tabs.active')}
              </Button>
              <Button 
                size="xs" 
                variant={viewMode === 'archived' ? 'solid' : 'ghost'}
                colorPalette={viewMode === 'archived' ? 'white' : 'gray'}
                bg={viewMode === 'archived' ? 'white' : 'transparent'}
                color={viewMode === 'archived' ? 'black' : 'gray.500'}
                shadow={viewMode === 'archived' ? 'sm' : 'none'}
                onClick={() => setViewMode('archived')}
                borderRadius="md"
                px="3"
              >
                {t('tabs.archived')}
              </Button>
           </Box>
        </HStack>

        <HStack gap="3" flex="1" justify="flex-end" minW="300px">
           <InputGroup 
             flex="1" 
             maxW="300px" 
             startElement={<LuSearch color="gray.400" />}
             endElement={searchQuery ? (
                <IconButton 
                    size="xs" 
                    variant="ghost" 
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                >
                    <LuX />
                </IconButton>
             ) : undefined}
           >
             <Input 
                placeholder={t('actions.searchPlaceholder') || "Search employees..."} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
                borderRadius="lg"
             />
           </InputGroup>

           <HStack gap="2">
            <Select.Root 
                    collection={filterCollection} 
                    value={departmentFilter} 
                    onValueChange={(e) => setDepartmentFilter(e.value)}
                    width="180px"
            >
                <Select.Trigger bg="white" borderRadius="lg">
                    <Select.ValueText placeholder="Filter Dept" />
                </Select.Trigger>
                <Portal>
                    <Select.Positioner>
                    <Select.Content maxH="320px" overflowY="auto" zIndex="popover">
                        {filterGroups.map(([group, items]) => (
                        <Select.ItemGroup key={group}>
                            <Select.ItemGroupLabel>{group}</Select.ItemGroupLabel>
                            {items.map(item => (
                            <Select.Item item={item} key={item.value}>
                                {item.label}
                            </Select.Item>
                            ))}
                        </Select.ItemGroup>
                        ))}
                    </Select.Content>
                    </Select.Positioner>
                </Portal>
                </Select.Root>
                {departmentFilter.length > 0 && (
                    <IconButton 
                        size="sm" 
                        variant="subtle" 
                        colorPalette="gray" 
                        onClick={() => setDepartmentFilter([])}
                        aria-label="Clear department filter"
                        borderRadius="lg"
                    >
                        <LuX />
                    </IconButton>
                )}
           </HStack>

           <DrawerRoot size="md" open={isDrawerOpen} onOpenChange={(e) => setIsDrawerOpen(e.open)}>
              <DrawerBackdrop />
              <DrawerTrigger asChild>
                <Button colorPalette="oxygen" onClick={() => setIsDrawerOpen(true)} borderRadius="lg">
                  <LuPlus /> {t('actions.addEmployee')}
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerCloseTrigger />
                <DrawerHeader>
                  <DrawerTitle>{t('drawer.title')}</DrawerTitle>
                </DrawerHeader>
                <DrawerBody>
                   <AddEmployeeForm onSuccess={() => {
                     setIsDrawerOpen(false)
                     setEmployees(employeeService.getAll())
                   }} />
                </DrawerBody>
              </DrawerContent>
            </DrawerRoot>
        </HStack>
      </HStack>

      <Separator />

      {/* 2. Main Content: Grouped Cards */}
      <Box minH="60vh">
        {filteredEmployees.length === 0 ? (
            <VStack py="20" color="gray.400">
                <LuSearch size="40px" />
                <Text>No employees found matching your criteria.</Text>
            </VStack>
        ) : (
            <Stack gap="2">
                {DEPARTMENT_CONFIG.map(dept => {
                    const groupEmployees = groupedEmployees.get(dept.id) || []
                    if (groupEmployees.length === 0) return null
                    
                    return (
                        <DepartmentGroup 
                            key={dept.id}
                            department={dept}
                            employees={groupEmployees}
                            selectedIds={selectedEmployeeIds}
                            onSelectEmployee={handleSelectOne}
                            onAction={handleAction}
                        />
                    )
                })}
                
                {/* Fallback for 'Other' */}
                {(groupedEmployees.get('other')?.length || 0) > 0 && (
                     <DepartmentGroup 
                        department={{ id: 'other', label: 'Other', subDepartments: [] }}
                        employees={groupedEmployees.get('other') || []}
                        selectedIds={selectedEmployeeIds}
                        onSelectEmployee={handleSelectOne}
                        onAction={handleAction}
                    />
                )}
            </Stack>
        )}
      </Box>

      {/* 3. Bulk Actions Floating Bar */}
      {selectedEmployeeIds.length > 0 && (
          <Portal>
              <Box 
                position="fixed" 
                bottom="6" 
                left="50%" 
                transform="translateX(-50%)" 
                bg="gray.900" 
                color="white" 
                px="6" 
                py="3" 
                borderRadius="full" 
                shadow="2xl" 
                zIndex="popover"
                animation="slide-in-bottom 0.3s ease-out"
                borderWidth="1px"
                borderColor="gray.700"
              >
                  <HStack gap="6">
                      <Text fontWeight="bold">{t('bulk.selected', { count: selectedEmployeeIds.length })}</Text>
                      <Separator orientation="vertical" h="20px" borderColor="gray.600" />
                      <Button 
                        size="sm" 
                        colorPalette="oxygen" 
                        variant="solid" 
                        onClick={() => {
                            setTransactionEmployeeIds(selectedEmployeeIds)
                            setIsTransactionDrawerOpen(true)
                        }}
                      >
                          <LuPlus /> {t('bulk.addTransaction')}
                      </Button>
                      <IconButton 
                        size="xs" 
                        variant="ghost" 
                        color="gray.400" 
                        _hover={{ color: "white", bg: "whiteAlpha.200" }} 
                        onClick={() => setSelectedEmployeeIds([])}
                        aria-label={t('bulk.clear')}
                      >
                          <LuX />
                      </IconButton>
                  </HStack>
              </Box>
          </Portal>
      )}

      <TransactionDrawer 
        open={isTransactionDrawerOpen} 
        onOpenChange={setIsTransactionDrawerOpen} 
        employeeIds={transactionEmployeeIds} 
        onSuccess={() => {
            setSelectedEmployeeIds([]) // Clear bulk selection
            setTransactionEmployeeIds([]) // Clear dialog target
        }}
      />
    </Box>
  )
}
