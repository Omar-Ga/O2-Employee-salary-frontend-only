import { Box, Button, HStack, Heading, Input, createListCollection, Separator, Portal, VStack, Stack, Text, IconButton, Spinner, Center, Icon } from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { employeeService } from "@/services/employee.service"
import { LuPlus, LuSearch, LuX } from "react-icons/lu"
import { useState, useMemo, Fragment } from "react"
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
import { SelectRoot, SelectTrigger, SelectValueText, SelectContent, SelectItemGroup, SelectItem } from "@/components/ui/select"

import { DepartmentGroup } from "@/components/employees/DepartmentGroup"
import { Employee } from "@/types"
import { EmployeesRecord } from "@/types/pocketbase-types"
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer"
import { AddEmployeeForm } from "@/components/employees/AddEmployeeForm"
import { useDepartments } from "@/hooks/useDepartments"

export const Employees = () => {
  const { t } = useTranslation(['employees', 'sidebar'])
  const queryClient = useQueryClient()
  const { departments: departmentConfig } = useDepartments()

  // Data Fetching
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const result = await employeeService.getAll(1, 1000)
      return result.items
    }
  })

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<EmployeesRecord> }) => employeeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toaster.create({ title: t('toast.restored'), type: "success" })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: employeeService.softDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toaster.create({ title: t('toast.archived'), type: "success" })
    }
  })

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // View State
  const [viewMode, setViewMode] = useState<"active" | "archived">("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([])

  // Selection State
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [transactionEmployeeIds, setTransactionEmployeeIds] = useState<string[]>([])
  const [isTransactionDrawerOpen, setIsTransactionDrawerOpen] = useState(false)

  // Edit State
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)

  // Filter Logic
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      // 1. Status Filter
      const statusMatch = viewMode === 'archived' ? e.isArchived : !e.isArchived
      if (!statusMatch) return false

      // 2. Search Filter
      const searchLower = searchQuery.toLowerCase()
      const searchMatch = !searchQuery ||
        e.name.toLowerCase().includes(searchLower) ||
        (e.email && e.email.toLowerCase().includes(searchLower)) ||
        (e.jobTitle && e.jobTitle.toLowerCase().includes(searchLower))
      if (!searchMatch) return false

      // 3. Department Filter
      if (departmentFilter.length > 0) {
        return departmentFilter.includes(e.department)
      }

      return true
    })
  }, [employees, viewMode, searchQuery, departmentFilter])

  // Grouping Logic
  const groupedEmployees = useMemo(() => {
    const groups = new Map<string, Employee[]>()

    // Initialize groups for parent departments
    departmentConfig.forEach(parent => {
      groups.set(parent.id, [])
    })
    groups.set('other', [])

    filteredEmployees.forEach((e) => {
      // Find parent department based on sub-department match
      const parent = departmentConfig.find(p => p.subDepartments.some(sub => sub.id === e.department))
      const groupId = parent ? parent.id : 'other'
      if (groups.has(groupId)) {
        groups.get(groupId)!.push(e)
      } else {
        groups.get('other')!.push(e)
      }
    })

    return groups
  }, [filteredEmployees, departmentConfig])

  // Handlers
  const handleAction = (action: string, id: string) => {
    if (action === 'archive') {
      deleteMutation.mutate(id)
    } else if (action === 'restore') {
      updateMutation.mutate({ id, data: { isArchived: false } })
    } else if (action === 'delete') {
      console.log("Delete not fully implemented")
    } else if (action === 'transaction') {
      setTransactionEmployeeIds([id])
      setIsTransactionDrawerOpen(true)
    } else if (action === 'edit') {
      const emp = employees.find((e: Employee) => e.id === id)
      if (emp) {
        setEmployeeToEdit(emp)
        setIsEditDrawerOpen(true)
      }
    }
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
    const items = departmentConfig.flatMap(dept =>
      dept.subDepartments.map(sub => ({
        label: sub.label,
        value: sub.id,
        group: dept.label
      }))
    )
    return createListCollection({ items })
  }, [departmentConfig])

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
              placeholder={t('actions.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="white"
              borderRadius="lg"
            />
          </InputGroup>

          <HStack gap="2">
            <SelectRoot
              collection={filterCollection}
              value={departmentFilter}
              onValueChange={(e) => setDepartmentFilter(e.value)}
              width="180px"
            >
              <SelectTrigger bg="white" borderRadius="lg">
                <SelectValueText placeholder={t('actions.filterDept')} />
              </SelectTrigger>
              <SelectContent maxH="320px" overflowY="auto" zIndex="popover">
                {filterGroups.map(([group, items], index) => (
                  <Fragment key={group}>
                    {index > 0 && <Separator my="1" borderColor="gray.200" />}
                    <SelectItemGroup label={group}>
                      {items.map(item => (
                        <SelectItem item={item} key={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectItemGroup>
                  </Fragment>
                ))}
              </SelectContent>
            </SelectRoot>
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
                  queryClient.invalidateQueries({ queryKey: ['employees'] })
                }} />
              </DrawerBody>
            </DrawerContent>
          </DrawerRoot>
        </HStack>
      </HStack>

      <Separator />

      {/* 2. Main Content: Grouped Cards */}
      <Box minH="60vh">
        {isLoading ? (
          <Center py="20">
            <Spinner size="xl" />
          </Center>
        ) : filteredEmployees.length === 0 ? (
          <VStack py="20" color="gray.400">
            <Icon as={LuSearch} boxSize="40px" />
            <Text>{t('empty.noMatch')}</Text>
          </VStack>
        ) : (
          <Stack gap="2">
            {departmentConfig.map(parent => {
              const groupEmployees = groupedEmployees.get(parent.id) || []
              if (groupEmployees.length === 0) return null

              return (
                <DepartmentGroup
                  key={parent.id}
                  department={parent}
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
                department={{ id: 'other', label: t('tabs.other', { defaultValue: 'Other' }), colorPalette: 'gray', subDepartments: [] }}
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

      <DrawerRoot size="md" open={isEditDrawerOpen} onOpenChange={(e) => {
        setIsEditDrawerOpen(e.open)
        if (!e.open) setEmployeeToEdit(null)
      }}>
        <DrawerBackdrop />
        <DrawerContent>
          <DrawerCloseTrigger />
          <DrawerHeader>
            <DrawerTitle>{t('drawer.editTitle', { defaultValue: 'Edit Employee' })}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            {employeeToEdit && (
              <AddEmployeeForm
                initialData={employeeToEdit}
                onSuccess={() => {
                  setIsEditDrawerOpen(false)
                  setEmployeeToEdit(null)
                  queryClient.invalidateQueries({ queryKey: ['employees'] })
                }}
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>
    </Box>
  )
}
