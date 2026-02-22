import { Box, Button, HStack, Heading, Badge, Text, Tabs, Stack, Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { employeeService } from "@/services/employee.service"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { payrollService } from "@/services/payroll.service"
import { transactionService } from "@/services/transaction.service"
import { LuWallet, LuHistory, LuCheck, LuTrendingUp, LuDollarSign, LuPrinter } from "react-icons/lu"
import { formatCurrency } from "@/lib/utils"
import { useState, useMemo } from "react"
import { toaster } from "@/components/ui/toaster"
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer"
import { useDepartments } from "@/hooks/useDepartments"
import { DepartmentPayrollGroup } from "@/components/payroll/DepartmentPayrollGroup"
import { HistoricalDepartmentPayrollGroup } from "@/components/payroll/HistoricalDepartmentPayrollGroup"
import { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { PayslipsPrintTemplate } from "@/components/payroll/PayslipsPrintTemplate"

export const Payroll = () => {
  const { t } = useTranslation(['payroll', 'sidebar'])
  const [activeTab, setActiveTab] = useState("run")

  return (
    <Box spaceY="6">
      <Heading size="xl">{t('sidebar:items.payroll')}</Heading>

      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
        <Tabs.List mb="6">
          <Tabs.Trigger value="run">
            <Icon as={LuWallet} mr="2" /> {t('tabs.run')}
          </Tabs.Trigger>
          <Tabs.Trigger value="history">
            <Icon as={LuHistory} mr="2" /> {t('tabs.history')}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="run">
          <PayrollRunView />
        </Tabs.Content>
        <Tabs.Content value="history">
          <PayrollHistoryView />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}

const PayrollRunView = () => {
  const { t } = useTranslation('payroll')
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeService.getAll,
    select: (data) => (data as unknown as import("@/types").Employee[]).filter(e => !e.isArchived)
  })
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionService.getAll()
  })
  const { departments: departmentConfig } = useDepartments()

  const [selectedEmp, setSelectedEmp] = useState<string | null>(null) // For Add Transaction Dialog
  const [isTxDrawerOpen, setIsTxDrawerOpen] = useState(false)
  const queryClient = useQueryClient()

  const closeMonthMutation = useMutation({
    mutationFn: () => payrollService.closeMonth(employees, transactions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['payroll_runs'] })
      queryClient.invalidateQueries({ queryKey: ['lastClosedPayroll'] })
      toaster.create({ title: t('run.toast.monthClosed'), type: "success" })
    },
    onError: (error: any) => {
      toaster.create({ title: "Failed to close month", description: error.message, type: "error" })
    }
  })

  const handleCloseMonth = () => {
    if (employees.length === 0) return
    closeMonthMutation.mutate()
  }

  // Calculate global totals
  const globalTotals = useMemo(() => {
    return employees.reduce((acc, emp) => {
      const empTx = transactions.filter(t => t.employeeId === emp.id)
      const slip = payrollService.calculateSlip(emp, empTx)
      return {
        basic: acc.basic + slip.basicSalary,
        net: acc.net + slip.netSalary
      }
    }, { basic: 0, net: 0 })
  }, [employees, transactions])

  // Grouping logic
  const groupedEmployees = useMemo(() => {
    const groups = new Map<string, import("@/types").Employee[]>()

    departmentConfig.forEach(parent => {
      groups.set(parent.id, [])
    })
    groups.set('other', [])

    employees.forEach((e: any) => {
      const parent = departmentConfig.find(p => p.subDepartments.some(sub => sub.id === e.department))
      const groupId = parent ? parent.id : 'other'
      if (groups.has(groupId)) {
        groups.get(groupId)!.push(e)
      } else {
        groups.get('other')!.push(e)
      }
    })

    return groups
  }, [employees, departmentConfig])

  return (
    <Stack gap="6">
      <HStack justify="space-between" align="stretch">
        <HStack gap="4" flex="1">
          {/* Summary Cards */}
          <Box p="4" borderWidth="1px" borderRadius="xl" bg="white" flex="1">
            <HStack gap="3" color="gray.500" mb="2">
              <Icon as={LuDollarSign} boxSize="5" />
              <Text fontSize="sm" fontWeight="medium" textTransform="uppercase">{t('run.globalTotalBasic', { defaultValue: 'Total Basic Payroll' })}</Text>
            </HStack>
            <Text fontSize="3xl" fontWeight="bold" color="gray.800">
              {formatCurrency(globalTotals.basic)}
            </Text>
          </Box>
          <Box p="4" borderWidth="1px" borderRadius="xl" bg="white" flex="1">
            <HStack gap="3" color="green.600" mb="2">
              <Icon as={LuTrendingUp} boxSize="5" />
              <Text fontSize="sm" fontWeight="medium" textTransform="uppercase">{t('run.globalTotalNet', { defaultValue: 'Total Net Payout' })}</Text>
            </HStack>
            <Text fontSize="3xl" fontWeight="bold" color="green.600">
              {formatCurrency(globalTotals.net)}
            </Text>
          </Box>
        </HStack>

        <Box display="flex" alignItems="flex-end">
          <Button colorPalette="oxygen" onClick={handleCloseMonth} loading={closeMonthMutation.isPending} size="lg">
            <LuCheck /> {t('run.closeMonth')}
          </Button>
        </Box>
      </HStack>

      <Stack gap="4">
        {departmentConfig.map(parent => {
          const groupEmployees = groupedEmployees.get(parent.id) || []
          if (groupEmployees.length === 0) return null

          return (
            <DepartmentPayrollGroup
              key={parent.id}
              department={parent}
              employees={groupEmployees}
              transactions={transactions}
              onManage={(id) => { setSelectedEmp(id); setIsTxDrawerOpen(true) }}
            />
          )
        })}

        {/* Fallback for 'Other' */}
        {(groupedEmployees.get('other')?.length || 0) > 0 && (
          <DepartmentPayrollGroup
            department={{ id: 'other', label: t('tabs.other', { ns: 'employees', defaultValue: 'Other' }), colorPalette: 'gray', subDepartments: [] }}
            employees={groupedEmployees.get('other') || []}
            transactions={transactions}
            onManage={(id) => { setSelectedEmp(id); setIsTxDrawerOpen(true) }}
          />
        )}
      </Stack>

      <TransactionDrawer
        open={isTxDrawerOpen}
        onOpenChange={setIsTxDrawerOpen}
        employeeIds={selectedEmp ? [selectedEmp] : []}
        onSuccess={() => { }}
      />
    </Stack>
  )
}

const PayrollHistoryView = () => {
  const { t } = useTranslation('payroll')
  const { departments: departmentConfig } = useDepartments()
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['payroll_runs'],
    queryFn: payrollService.getHistory
  })

  const selectedRun = useMemo(() =>
    history.find(r => r.id === selectedRunId),
    [history, selectedRunId]
  )

  if (isLoading) return <Text color="gray.500">{t('history.loading')}</Text>

  if (selectedRunId && selectedRun) {
    // Group historical slips by department
    const groupedSlips = new Map<string, any[]>()
    departmentConfig.forEach(d => groupedSlips.set(d.id, []))
    groupedSlips.set('other', [])

    selectedRun.slips.forEach(slip => {
      const parent = departmentConfig.find(p => p.id === slip.departmentId || p.subDepartments.some(sub => sub.id === slip.departmentId))
      const groupId = parent ? parent.id : 'other'
      if (groupedSlips.has(groupId)) {
        groupedSlips.get(groupId)!.push(slip)
      } else {
        groupedSlips.get('other')!.push(slip)
      }
    })

    return (
      <Stack gap="6">
        <HStack justify="space-between">
          <Button variant="ghost" onClick={() => setSelectedRunId(null)} size="sm">
            <LuWallet style={{ marginRight: '8px' }} /> {t('run.backToHistory')}
          </Button>
          <HStack gap="4">
            <Box textAlign="right">
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">{t('history.totalPayout')}</Text>
              <Text fontSize="lg" fontWeight="bold" color="green.600">
                {formatCurrency(selectedRun.slips.reduce((acc, s) => acc + s.netSalary, 0))}
              </Text>
            </Box>
          </HStack>
        </HStack>

        <Stack gap="4">
          {departmentConfig.map(parent => {
            const slips = groupedSlips.get(parent.id) || []
            if (slips.length === 0) return null
            return (
              <HistoricalDepartmentPayrollGroup
                key={parent.id}
                department={parent}
                slips={slips}
              />
            )
          })}

          {(groupedSlips.get('other')?.length || 0) > 0 && (
            <HistoricalDepartmentPayrollGroup
              department={{ id: 'other', label: t('tabs.other', { ns: 'employees', defaultValue: 'Other' }), colorPalette: 'gray', subDepartments: [] }}
              slips={groupedSlips.get('other') || []}
            />
          )}
        </Stack>
      </Stack>
    )
  }

  return (
    <Box>
      {history.length === 0 ? <Text color="gray.500">{t('history.empty')}</Text> : (
        <Stack gap="4">
          {history.map(run => (
            <HistoryRunCard
              key={run.id}
              run={run}
              onClick={() => setSelectedRunId(run.id)}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}

const HistoryRunCard = ({ run, onClick }: { run: any; onClick: () => void }) => {
  const { t } = useTranslation('payroll')
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Payslips_${run.period}`,
  })

  const totals = run.slips.reduce((acc: any, s: any) => ({
    basic: acc.basic + s.basicSalary,
    net: acc.net + s.netSalary
  }), { basic: 0, net: 0 })

  return (
    <Box
      p="4"
      borderWidth="1px"
      borderRadius="xl"
      bg="white"
      cursor="pointer"
      _hover={{ borderColor: 'oxygen.500', shadow: 'sm', bg: 'gray.50' }}
      onClick={onClick}
      transition="all 0.2s"
      position="relative"
    >
      {/* Hidden Print Template */}
      <Box display="none">
        <PayslipsPrintTemplate ref={printRef} slips={run.slips} period={run.period} />
      </Box>

      <HStack justify="space-between" mb="4">
        <Box>
          <HStack gap="2">
            <LuHistory color="gray.400" />
            <Text fontWeight="bold" fontSize="lg">{run.period}</Text>
          </HStack>
          <Text fontSize="sm" color="gray.500">{new Date(run.date).toLocaleDateString()}</Text>
        </Box>
        <HStack>
          <Badge colorPalette="green" variant="subtle" borderRadius="full">{t('history.closed')}</Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); handlePrint(); }}
          >
            <LuPrinter /> {t('history.printPayslips', { defaultValue: 'Print Payslips' })}
          </Button>
        </HStack>
      </HStack>

      <HStack gap="8">
        <Box>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" mb="1">{t('run.totalBasic')}</Text>
          <Text fontWeight="bold" fontSize="md" color="gray.700">{formatCurrency(totals.basic)}</Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" mb="1">{t('run.totalNet')}</Text>
          <Text fontWeight="bold" fontSize="md" color="green.600">{formatCurrency(totals.net)}</Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" mb="1">{t('run.employeesCount')}</Text>
          <Text fontWeight="bold" fontSize="md" color="gray.700">{run.slips.length}</Text>
        </Box>
      </HStack>
    </Box>
  )
}
