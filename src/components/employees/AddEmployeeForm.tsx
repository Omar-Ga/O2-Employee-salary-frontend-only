import { Button, HStack, Heading, Input, Separator, Portal, Stack, Select, createListCollection } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { employeeService } from "@/services/employee.service"
import { useState, useMemo } from "react"
import { toaster } from "@/components/ui/toaster"
import { DEPARTMENT_CONFIG } from "@/lib/departments"
import { Field } from "@/components/ui/field"

interface AddEmployeeFormProps {
  onSuccess: () => void
}

export const AddEmployeeForm = ({ onSuccess }: AddEmployeeFormProps) => {
  const { t } = useTranslation('employees')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '', // Stores sub-department ID
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

  // New centralized collection
  const departmentsCollection = useMemo(() => {
    // Transform our config into the format Chakra UI Select expects
    const items = DEPARTMENT_CONFIG.flatMap(dept => 
        dept.subDepartments.map(sub => ({
            label: sub.label,
            value: sub.id,
            group: dept.label
        }))
    )
    return createListCollection({ items })
  }, [])

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

  // Group items for rendering in Select
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
                   <Select.Content maxH="320px" overflowY="auto" zIndex="popover">
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
