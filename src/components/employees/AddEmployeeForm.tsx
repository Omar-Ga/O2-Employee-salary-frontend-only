import { Button, HStack, Heading, Input, Separator, Stack, createListCollection } from "@chakra-ui/react"
import { SelectRoot, SelectTrigger, SelectValueText, SelectContent, SelectItemGroup, SelectItem } from "@/components/ui/select"
import { Employee } from "@/types"
import type { FormEvent, ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { employeeService } from "@/services/employee.service"
import { useState, useMemo, Fragment } from "react"
import { toaster } from "@/components/ui/toaster"
import { useDepartments } from "@/hooks/useDepartments"
import type { DepartmentConfig } from "@/lib/departments"
import { Field } from "@/components/ui/field"
import type { EmployeesRecord } from "@/types/pocketbase-types"
import type { EmployeeScores } from "@/types"
import { EmployeesGradeOptions } from "@/types/pocketbase-types"

type EmployeeFormData = Pick<EmployeesRecord,
  'name' | 'email' | 'phone' | 'department' | 'jobTitle' | 'monthlySalary' | 'nationalId' | 'workHours'
> & {
  scores: EmployeeScores
}

interface AddEmployeeFormProps {
  onSuccess: () => void
  initialData?: Employee
}

export const AddEmployeeForm = ({ onSuccess, initialData }: AddEmployeeFormProps) => {
  const { t } = useTranslation('employees')
  const defaultGradeScore = initialData?.grade === 'Excellent' ? 90 : initialData?.grade === 'Good' ? 75 : initialData?.grade === 'Bad' ? 50 : 80;
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    department: initialData?.department || '', // Stores sub-department ID
    jobTitle: initialData?.jobTitle || '',
    monthlySalary: initialData?.monthlySalary || 5000,
    nationalId: initialData?.nationalId || '',
    workHours: initialData?.workHours || 270,
    scores: {
      performance: defaultGradeScore,
      dedication: defaultGradeScore,
      responsibility: defaultGradeScore
    }
  })

  // New centralized collection
  const { departments: departmentConfig } = useDepartments()
  const departmentsCollection = useMemo(() => {
    // Transform our config into the format Chakra UI Select expects
    const items = departmentConfig.flatMap((dept: DepartmentConfig) =>
      dept.subDepartments.map((sub) => ({
        label: sub.label,
        value: sub.id,
        group: dept.label
      }))
    )
    return createListCollection({ items })
  }, [departmentConfig])

  const calculateGrade = (p: number, d: number, r: number): EmployeesGradeOptions => {
    const avg = (p + d + r) / 3
    if (avg >= 85) return EmployeesGradeOptions.Excellent
    if (avg >= 70) return EmployeesGradeOptions.Good
    return EmployeesGradeOptions.Bad
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const grade = calculateGrade(formData.scores.performance, formData.scores.dedication, formData.scores.responsibility)

    try {
      if (initialData?.id) {
        await employeeService.update(initialData.id, {
          ...formData,
          grade
        })
        toaster.create({ title: t('toast.updated', { defaultValue: 'Employee updated' }), type: "success" })
      } else {
        await employeeService.create({
          ...formData,
          grade
        })
        toaster.create({ title: t('toast.created'), type: "success" })
      }
      onSuccess()
    } catch (error) {
      toaster.create({ title: initialData?.id ? "Error updating employee" : "Error creating employee", type: "error" })
    }
  }

  const updateScore = (key: keyof typeof formData.scores, value: number) => {
    setFormData(prev => ({
      ...prev,
      scores: { ...prev.scores, [key]: value }
    }))
  }

  // Group items for rendering in Select
  const groups = useMemo(() => {
    const groups: Record<string, { label: string; value: string; group: string }[]> = {}
    departmentsCollection.items.forEach((item) => {
      if (!groups[item.group]) groups[item.group] = []
      groups[item.group].push(item)
    })
    return Object.entries(groups)
  }, [departmentsCollection])

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="5">
        <Field label={t('form.fullName')} required>
          <Input value={formData.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. John Doe" />
        </Field>

        <HStack align="flex-start" gap="4">
          <Field label={t('form.email')}>
            <Input type="email" value={formData.email} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
          </Field>
          <Field label={t('form.phone')} required>
            <Input value={formData.phone} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })} placeholder="010XXXXXXXX" />
          </Field>
        </HStack>

        <HStack align="flex-start" gap="4">
          <Field label={t('form.department')} required>
            <SelectRoot
              collection={departmentsCollection}
              value={[formData.department]}
              onValueChange={(e) => setFormData({ ...formData, department: e.value[0] })}
            >
              <SelectTrigger>
                <SelectValueText placeholder={t('actions.selectDepartment')} />
              </SelectTrigger>
              <SelectContent portalled={false} maxH="320px" overflowY="auto" zIndex="popover">
                {groups.map(([group, items], index) => (
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
          </Field>
          <Field label={t('form.workHours')} required>
            <Input type="number" value={formData.workHours} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, workHours: Number(e.target.value) })} />
          </Field>
        </HStack>

        <HStack align="flex-start" gap="4">
          <Field label={t('form.nationalId')} required>
            <Input value={formData.nationalId} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nationalId: e.target.value })} placeholder="National ID" />
          </Field>
          <Field label={t('form.monthlySalary')} required>
            <Input type="number" value={formData.monthlySalary} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, monthlySalary: Number(e.target.value) })} />
          </Field>
        </HStack>

        <Field label={t('form.jobTitle')} required>
          <Input value={formData.jobTitle} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, jobTitle: e.target.value })} placeholder="e.g. Designer" />
        </Field>

        <Separator my="2" />
        <Heading size="sm" mb="2">{t('form.scores.title')}</Heading>

        <HStack>
          <Field label={t('form.scores.performance')}>
            <Input type="number" max={100} value={formData.scores.performance} onChange={(e: ChangeEvent<HTMLInputElement>) => updateScore('performance', Number(e.target.value))} />
          </Field>
          <Field label={t('form.scores.dedication')}>
            <Input type="number" max={100} value={formData.scores.dedication} onChange={(e: ChangeEvent<HTMLInputElement>) => updateScore('dedication', Number(e.target.value))} />
          </Field>
          <Field label={t('form.scores.responsibility')}>
            <Input type="number" max={100} value={formData.scores.responsibility} onChange={(e: ChangeEvent<HTMLInputElement>) => updateScore('responsibility', Number(e.target.value))} />
          </Field>
        </HStack>

        <Button type="submit" colorPalette="oxygen" w="full" mt="6" size="lg">
          {initialData ? t('actions.update', { defaultValue: 'Update Employee' }) : t('actions.create', { defaultValue: 'Create Employee' })}
        </Button>
      </Stack>
    </form>
  )
}
