import { Box, Button, HStack, Heading, IconButton, Table, Badge, Text, Tabs, Stack, Input, Select, createListCollection, Separator, Portal } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { employeeService } from "@/services/employee.service"
import { LuPlus, LuArchive, LuUndo, LuUserCheck, LuUserX, LuX } from "react-icons/lu"
import { formatCurrency } from "@/lib/utils"
import { useState, useMemo, useEffect } from "react"
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
import { Field } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer"

export const Employees = () => {
  const { t } = useTranslation(['employees', 'sidebar'])
  const [employees, setEmployees] = useState(employeeService.getAll())
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("active")
  
  // Selection State
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [transactionEmployeeIds, setTransactionEmployeeIds] = useState<string[]>([])
  const [isTransactionDrawerOpen, setIsTransactionDrawerOpen] = useState(false)

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => activeTab === 'archived' ? e.isArchived : !e.isArchived)
  }, [employees, activeTab])

  // Reset selection on tab change
  useEffect(() => {
    setSelectedEmployeeIds([])
  }, [activeTab])

  const handleDelete = (id: string) => {
    employeeService.softDelete(id)
    setEmployees(employeeService.getAll())
    toaster.create({ title: t('toast.archived'), type: "success" })
  }

  const handleRestore = (id: string) => {
    const emp = employees.find(e => e.id === id)
    if (emp) {
      emp.isArchived = false
      employeeService.update(id, emp)
      setEmployees(employeeService.getAll())
      toaster.create({ title: t('toast.restored'), type: "success" })
    }
  }

  // Selection Logic
  const allSelected = filteredEmployees.length > 0 && selectedEmployeeIds.length === filteredEmployees.length
  const indeterminate = selectedEmployeeIds.length > 0 && !allSelected

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(filteredEmployees.map(e => e.id))
    } else {
      setSelectedEmployeeIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(prev => [...prev, id])
    } else {
      setSelectedEmployeeIds(prev => prev.filter(eid => eid !== id))
    }
  }

  return (
    <Box spaceY="6">
      <HStack justify="space-between">
        <Heading size="xl">{t('sidebar:items.employees')}</Heading>
        <DrawerRoot size="md" open={isDrawerOpen} onOpenChange={(e) => setIsDrawerOpen(e.open)}>
          <DrawerBackdrop />
          <DrawerTrigger asChild>
            <Button colorPalette="oxygen" onClick={() => setIsDrawerOpen(true)}>
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

      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
        <Tabs.List mb="6">
          <Tabs.Trigger value="active">
             <LuUserCheck /> {t('tabs.active')}
          </Tabs.Trigger>
          <Tabs.Trigger value="archived">
             <LuUserX /> {t('tabs.archived')}
          </Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="active">
          <Box borderWidth="1px" borderRadius="xl" overflow="hidden" bg="white" shadow="sm">
            <Table.Root>
              <Table.Header bg="gray.50">
                <Table.Row>
                  <Table.ColumnHeader w="40px">
                      <Checkbox 
                        checked={allSelected ? true : indeterminate ? "indeterminate" : false}
                        onCheckedChange={(e) => handleSelectAll(!!e.checked)}
                      />
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>{t('table.name')}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t('table.department')}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t('table.grade')}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t('table.salary')}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t('table.status')}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">{t('table.actions')}</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredEmployees.map((emp) => {
                  const isSelected = selectedEmployeeIds.includes(emp.id)
                  return (
                    <Table.Row 
                        key={emp.id} 
                        opacity={emp.isArchived ? 0.7 : 1} 
                        bg={isSelected ? "blue.50" : "transparent"}
                        cursor="pointer"
                        _hover={{ bg: isSelected ? "blue.100" : "gray.50" }}
                        onClick={() => {
                            if (!emp.isArchived) {
                                setTransactionEmployeeIds([emp.id])
                                setIsTransactionDrawerOpen(true)
                            }
                        }}
                    >
                      <Table.Cell onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                            checked={isSelected}
                            onCheckedChange={(e) => handleSelectOne(emp.id, !!e.checked)}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Box>
                          <Text fontWeight="medium">{emp.name}</Text>
                          <Text fontSize="xs" color="gray.500">{emp.jobTitle}</Text>
                        </Box>
                      </Table.Cell>
                      <Table.Cell>{emp.department}</Table.Cell>
                      <Table.Cell>
                         <GradeBadge grade={emp.grade} />
                      </Table.Cell>
                      <Table.Cell fontWeight="medium">{formatCurrency(emp.monthlySalary)}</Table.Cell>
                      <Table.Cell>
                         <Badge colorPalette={emp.isArchived ? "gray" : "green"} variant="solid">
                           {emp.isArchived ? t('status.archived') : t('status.active')}
                         </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="end">
                        <HStack justify="flex-end">
                            {emp.isArchived ? (
                                <IconButton variant="ghost" size="sm" colorPalette="blue" onClick={(e) => { e.stopPropagation(); handleRestore(emp.id) }} aria-label={t('actions.restore')}>
                                <LuUndo />
                                </IconButton>
                            ) : (
                                <IconButton variant="ghost" size="sm" colorPalette="red" onClick={(e) => { e.stopPropagation(); handleDelete(emp.id) }} aria-label={t('actions.archive')}>
                                <LuArchive />
                                </IconButton>
                            )}
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table.Root>
          </Box>
        </Tabs.Content>
      </Tabs.Root>

      {/* Bulk Actions Bar */}
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
                shadow="xl" 
                zIndex="popover"
                animation="slide-in-bottom 0.3s ease-out"
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

const GradeBadge = ({ grade }: { grade?: string }) => {
  const { t } = useTranslation('employees')
  let color = "gray"
  let label = 'N/A'
  
  if (grade === 'Excellent') {
    color = "green"
    label = t('grades.excellent')
  }
  if (grade === 'Good') {
    color = "blue"
    label = t('grades.good')
  }
  if (grade === 'Bad') {
    color = "red"
    label = t('grades.bad')
  }
  
  return (
    <Badge colorPalette={color} variant="subtle" px="2" borderRadius="full">
      {label}
    </Badge>
  )
}

const AddEmployeeForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { t } = useTranslation('employees')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    jobTitle: '',
    monthlySalary: 5000,
    nationalId: '', 
    workHours: 270,
    scores: {
      performance: 80,
      dedication: 80,
      responsibility: 80
    }
  })

  // Dynamic departments collection with translation
  const departmentsCollection = useMemo(() => {
    return createListCollection({
      items: [
        { label: t('departments.frontend'), value: "Frontend", group: t('departments.engineering') },
        { label: t('departments.backend'), value: "Backend", group: t('departments.engineering') },
        { label: t('departments.qualityAssurance'), value: "Quality Assurance", group: t('departments.engineering') },
        { label: t('departments.accounting'), value: "Accounting", group: t('departments.finance') },
        { label: t('departments.auditing'), value: "Auditing", group: t('departments.finance') },
        { label: t('departments.recruitment'), value: "Recruitment", group: t('departments.humanResources') },
        { label: t('departments.operations'), value: "Operations", group: t('departments.humanResources') },
      ],
    })
  }, [t])

  const calculateGrade = (p: number, d: number, r: number) => {
    const avg = (p + d + r) / 3
    if (avg >= 85) return 'Excellent'
    if (avg >= 70) return 'Good'
    return 'Bad'
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    const grade = calculateGrade(formData.scores.performance, formData.scores.dedication, formData.scores.responsibility)
    
    employeeService.create({
      ...formData as any,
      grade
    })
    toaster.create({ title: t('toast.created'), type: "success" })
    onSuccess()
  }

  const updateScore = (key: keyof typeof formData.scores, value: number) => {
    setFormData(prev => ({
      ...prev,
      scores: { ...prev.scores, [key]: value }
    }))
  }

  const groups = useMemo(() => {
      const groups: Record<string, any[]> = {}
      departmentsCollection.items.forEach(item => {
          if (!groups[item.group]) groups[item.group] = []
          groups[item.group].push(item)
      })
      return Object.entries(groups)
  }, [departmentsCollection])

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="5">
        <Field label={t('form.fullName')} required>
          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
        </Field>

        <HStack align="flex-start" gap="4">
          <Field label={t('form.email')} required>
            <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
          </Field>
          <Field label={t('form.phone')} required>
            <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="010XXXXXXXX" />
          </Field>
        </HStack>
        
        <HStack align="flex-start" gap="4">
          <Field label={t('form.department')} required>
            <Select.Root 
                collection={departmentsCollection} 
                value={[formData.department]} 
                onValueChange={(e) => setFormData({...formData, department: e.value[0]})}
            >
               <Select.Trigger>
                  <Select.ValueText placeholder={t('actions.selectDepartment')} />
               </Select.Trigger>
               <Portal>
                 <Select.Positioner>
                   <Select.Content maxH="320px" overflowY="auto">
                     {groups.map(([group, items]) => (
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
          </Field>
          <Field label={t('form.workHours')} required>
             <Input type="number" value={formData.workHours} onChange={e => setFormData({...formData, workHours: Number(e.target.value)})} />
          </Field>
        </HStack>

        <HStack align="flex-start" gap="4">
           <Field label={t('form.nationalId')} required>
             <Input value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} placeholder="National ID" />
           </Field>
           <Field label={t('form.monthlySalary')} required>
             <Input type="number" value={formData.monthlySalary} onChange={e => setFormData({...formData, monthlySalary: Number(e.target.value)})} />
           </Field>
        </HStack>

        <Field label={t('form.jobTitle')} required>
          <Input value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} placeholder="e.g. Designer" />
        </Field>

        <Separator my="2" />
        <Heading size="sm" mb="2">{t('form.scores.title')}</Heading>
        
        <HStack>
          <Field label={t('form.scores.performance')}>
            <Input type="number" max={100} value={formData.scores.performance} onChange={e => updateScore('performance', Number(e.target.value))} />
          </Field>
          <Field label={t('form.scores.dedication')}>
            <Input type="number" max={100} value={formData.scores.dedication} onChange={e => updateScore('dedication', Number(e.target.value))} />
          </Field>
          <Field label={t('form.scores.responsibility')}>
            <Input type="number" max={100} value={formData.scores.responsibility} onChange={e => updateScore('responsibility', Number(e.target.value))} />
          </Field>
        </HStack>

        <Button type="submit" colorPalette="oxygen" w="full" mt="6" size="lg">{t('actions.create')}</Button>
      </Stack>
    </form>
  )
}
