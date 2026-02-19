import { Box, Button, HStack, Heading, Table, Badge, Text, Tabs, Stack, Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { employeeService } from "@/services/employee.service"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { payrollService } from "@/services/payroll.service"
import { transactionService } from "@/services/transaction.service"
import { LuWallet, LuHistory, LuCheck } from "react-icons/lu"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"
import { toaster } from "@/components/ui/toaster"
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer"

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
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null) // For Add Transaction Dialog
  const [isTxDrawerOpen, setIsTxDrawerOpen] = useState(false)
  const queryClient = useQueryClient()

  const closeMonthMutation = useMutation({
    mutationFn: () => payrollService.closeMonth(employees, transactions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['payroll_runs'] })
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

  return (
    <Stack gap="6">
      <HStack justify="flex-end">
        <Button colorPalette="oxygen" onClick={handleCloseMonth} loading={closeMonthMutation.isPending}>
          <LuCheck /> {t('run.closeMonth')}
        </Button>
      </HStack>

      <Box borderWidth="1px" borderRadius="xl" overflow="hidden" bg="white">
        <Table.Root>
          <Table.Header bg="gray.50">
            <Table.Row>
              <Table.ColumnHeader>{t('run.table.employee')}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">{t('run.table.basic')}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">{t('run.table.additions')}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">{t('run.table.deductions')}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">{t('run.table.netSalary')}</Table.ColumnHeader>
              <Table.ColumnHeader></Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {employees.map(emp => {
              const empTx = transactions.filter(t => t.employeeId === emp.id)
              const slip = payrollService.calculateSlip(emp, empTx)
              return (
                <Table.Row key={emp.id}>
                  <Table.Cell>
                    <Text fontWeight="medium">{emp.name}</Text>
                  </Table.Cell>
                  <Table.Cell textAlign="end">{formatCurrency(slip.basicSalary)}</Table.Cell>
                  <Table.Cell textAlign="end" color="green.600">+{formatCurrency(slip.additions)}</Table.Cell>
                  <Table.Cell textAlign="end" color="red.600">-{formatCurrency(slip.deductions)}</Table.Cell>
                  <Table.Cell textAlign="end" fontWeight="bold">{formatCurrency(slip.netSalary)}</Table.Cell>
                  <Table.Cell textAlign="end">
                    <Button size="xs" variant="outline" onClick={() => { setSelectedEmp(emp.id); setIsTxDrawerOpen(true) }}>
                      {t('run.table.manage')}
                    </Button>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
      </Box>

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
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['payroll_runs'],
    queryFn: payrollService.getHistory
  })

  if (isLoading) return <Text color="gray.500">{t('history.loading')}</Text>

  return (
    <Box>
      {history.length === 0 ? <Text color="gray.500">{t('history.empty')}</Text> : (
        <Stack>
          {history.map(run => (
            <Box key={run.id} p="4" borderWidth="1px" borderRadius="lg" bg="white">
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="bold" fontSize="lg">{run.id}</Text>
                  <Text fontSize="sm" color="gray.500">{new Date(run.date).toLocaleDateString()}</Text>
                </Box>
                <Badge colorPalette="green">{t('history.closed')}</Badge>
              </HStack>
              <Box mt="4">
                <Text fontSize="sm" color="gray.600">{t('history.totalPayout')}: <b>{formatCurrency(run.slips.reduce((acc, s) => acc + s.netSalary, 0))}</b></Text>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}
