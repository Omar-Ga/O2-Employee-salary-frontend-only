import { Box, Button, Dialog, HStack, Heading, Badge, Text, Tabs, Stack, Icon, Spinner, Center, NativeSelect } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { employeeService } from "@/services/employee.service"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { payrollService } from "@/services/payroll.service"
import { transactionService } from "@/services/transaction.service"
import { LuWallet, LuHistory, LuCheck, LuTrendingUp, LuBanknote, LuPrinter, LuTrash2 } from "react-icons/lu"
import { formatCurrency } from "@/lib/utils"
import { useState, useMemo, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { PayslipsPrintTemplate } from "@/components/payroll/PayslipsPrintTemplate"
import { PayrollReportPrintTemplate } from "@/components/payroll/PayrollReportPrintTemplate"
import { toaster } from "@/components/ui/toaster"
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer"
import { useDepartments } from "@/hooks/useDepartments"
import { DepartmentPayrollGroup } from "@/components/payroll/DepartmentPayrollGroup"
import { HistoricalDepartmentPayrollGroup } from "@/components/payroll/HistoricalDepartmentPayrollGroup"
import { PayrollRun, PayrollSlip } from "@/types"

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
  const { data: employeesData, isLoading: isEmpLoading } = useQuery({
    queryKey: ['employees', 'active', 'all'],
    queryFn: () => employeeService.getAllActive()
  })

  // We fetch all active employees to accurately group and sum totals for the current run
  const employees = employeesData || []

  // Fetch transactions only for the currently visible employees
  const employeeIds = useMemo(() => employees.map(e => e.id), [employees])
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', 'open'],
    queryFn: () => transactionService.getForEmployees(employeeIds),
    enabled: employeeIds.length > 0
  })

  // Fetch stats for the global totals (server-side calculation)
  const { data: stats } = useQuery({
    queryKey: ['payrollStats'],
    queryFn: payrollService.getStats,
    staleTime: 0
  })

  const { departments: departmentConfig } = useDepartments()

  const [selectedEmp, setSelectedEmp] = useState<string | null>(null)
  const [isTxDrawerOpen, setIsTxDrawerOpen] = useState(false)
  const queryClient = useQueryClient()

  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${now.getFullYear()}-${month}`
  })

  const currentYear = new Date().getFullYear()
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0')
    return { value: `${currentYear}-${m}`, label: t(`months.${m}`) }
  })

  const closeMonthMutation = useMutation({
    mutationFn: () => payrollService.closeMonth(selectedPeriod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['payroll_runs'] })
      queryClient.invalidateQueries({ queryKey: ['lastClosedPayroll'] })
      queryClient.invalidateQueries({ queryKey: ['payrollStats'] })
      setIsCloseDialogOpen(false)
      toaster.create({ title: t('run.toast.monthClosed'), type: "success" })
    },
    onError: (error: Error) => {
      setIsCloseDialogOpen(false)
      toaster.create({ title: "Failed to close month", description: error.message, type: "error" })
    }
  })

  const handleCloseMonth = () => {
    if (employees.length === 0) return
    closeMonthMutation.mutate()
  }

  // Grouping logic (for the current page)
  const groupedEmployees = useMemo(() => {
    const groups = new Map<string, import("@/types").Employee[]>()

    departmentConfig.forEach(parent => {
      groups.set(parent.id, [])
    })
    groups.set('other', [])

    employees.forEach((e) => {
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

  if (isEmpLoading) return <Center py="20"><Spinner /></Center>

  return (
    <Stack gap="6">
      <HStack justify="space-between" align="stretch">
        <HStack gap="4" flex="1">
          {/* Summary Cards - Powered by Server Stats */}
          <Box p="4" borderWidth="1px" borderRadius="xl" bg="white" flex="1">
            <HStack gap="3" color="gray.500" mb="2">
              <Icon as={LuBanknote} boxSize="5" />
              <Text fontSize="sm" fontWeight="medium" textTransform="uppercase">{t('run.globalTotalBasic', { defaultValue: 'Total Basic Payroll' })}</Text>
            </HStack>
            <Text fontSize="3xl" fontWeight="bold" color="gray.800">
              {formatCurrency(stats?.currentGross || 0)}
            </Text>
          </Box>
          <Box p="4" borderWidth="1px" borderRadius="xl" bg="white" flex="1">
            <HStack gap="3" color="green.600" mb="2">
              <Icon as={LuTrendingUp} boxSize="5" />
              <Text fontSize="sm" fontWeight="medium" textTransform="uppercase">{t('run.globalTotalNet', { defaultValue: 'Total Net Payout' })}</Text>
            </HStack>
            <Text fontSize="3xl" fontWeight="bold" color="green.600">
              {formatCurrency(stats?.currentNetTotal || 0)}
            </Text>
          </Box>
        </HStack>

        <Box display="flex" alignItems="flex-end">
          <Button colorPalette="oxygen" onClick={() => setIsCloseDialogOpen(true)} size="lg">
            <LuCheck /> {t('run.closeMonth')}
          </Button>

          <Dialog.Root
            open={isCloseDialogOpen}
            onOpenChange={(e) => setIsCloseDialogOpen(e.open)}
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>{t('run.closeDialog.title')}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Text mb="4">{t('run.closeDialog.selectMonth')}</Text>
                  <NativeSelect.Root size="lg">
                    <NativeSelect.Field
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                      {monthOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>
                    {t('run.closeDialog.cancel')}
                  </Button>
                  <Button
                    colorPalette="oxygen"
                    loading={closeMonthMutation.isPending}
                    onClick={handleCloseMonth}
                  >
                    {t('run.closeDialog.confirm')}
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>
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

      {/* No pagination controls — we fetch all active employees for accurate totals */}

      <TransactionDrawer
        open={isTxDrawerOpen}
        onOpenChange={setIsTxDrawerOpen}
        employeeIds={selectedEmp ? [selectedEmp] : []}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['payrollStats'] })
          queryClient.invalidateQueries({ queryKey: ['transactions'] })
        }}
      />
    </Stack>
  )
}

const PayrollHistoryView = () => {
  const { t } = useTranslation('payroll')
  const { departments: departmentConfig } = useDepartments()
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  // Print ref and handler — wired to the hidden PayslipsPrintTemplate
  const printPayslipsRef = useRef<HTMLDivElement>(null)
  const handlePrintPayslips = useReactToPrint({
    contentRef: printPayslipsRef,
    documentTitle: selectedRunId ? `Payslips-${selectedRunId}` : 'Payslips',
  })

  // Print ref and handler — wired to the hidden PayrollReportPrintTemplate
  const printReportRef = useRef<HTMLDivElement>(null)
  const handlePrintReport = useReactToPrint({
    contentRef: printReportRef,
    documentTitle: selectedRunId ? `Payroll-Report-${selectedRunId}` : 'Payroll-Report',
  })

  const { data: runList, isLoading } = useQuery({
    queryKey: ['payroll_runs', page],
    queryFn: () => payrollService.getRuns(page, 10)
  })

  const history = runList?.items || []

  // Fetch slips only when a run is selected
  const { data: runSlips = [], isLoading: isLoadingSlips } = useQuery({
    queryKey: ['run_slips', selectedRunId],
    queryFn: () => selectedRunId ? payrollService.getRunSlips(selectedRunId) : Promise.resolve([]),
    enabled: !!selectedRunId
  })

  const selectedRun = useMemo(() =>
    history.find(r => r.id === selectedRunId),
    [history, selectedRunId]
  )

  // Determine if the selected run is within the 10-day revert/delete window
  const isRevertEligible = useMemo(() => {
    if (!selectedRun) return false
    const diffMs = new Date().getTime() - new Date(selectedRun.created).getTime()
    return diffMs <= 10 * 24 * 60 * 60 * 1000
  }, [selectedRun])

  const revertMutation = useMutation({
    mutationFn: (runId: string) => payrollService.revertRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollStats'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['run_slips'] })
      queryClient.invalidateQueries({ queryKey: ['payroll_runs'] })
      setIsRevertDialogOpen(false)
      setSelectedRunId(null)
      toaster.create({ title: t('history.toast.reverted'), type: 'success' })
    },
    onError: (error: Error) => {
      setIsRevertDialogOpen(false)
      toaster.create({ title: t('history.toast.revertError'), description: error.message, type: 'error' })
    },
  })

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: (runId: string) => payrollService.deleteRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollStats'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['run_slips'] })
      queryClient.invalidateQueries({ queryKey: ['payroll_runs'] })
      setIsDeleteDialogOpen(false)
      setSelectedRunId(null)
      toaster.create({ title: t('history.toast.deleted'), type: 'success' })
    },
    onError: (error: Error) => {
      setIsDeleteDialogOpen(false)
      toaster.create({ title: t('history.toast.deleteError'), description: error.message, type: 'error' })
    },
  })

  if (isLoading) return <Text color="gray.500">{t('history.loading')}</Text>

  if (selectedRunId && selectedRun) {
    if (isLoadingSlips) {
      return <Center py="10"><Spinner /></Center>
    }

    // Group historical slips by department
    const groupedSlips = new Map<string, PayrollSlip[]>()
    departmentConfig.forEach(d => groupedSlips.set(d.id, []))
    groupedSlips.set('other', [])

    runSlips.forEach(slip => {
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
                {formatCurrency(selectedRun.totalNet || 0)}
              </Text>
            </Box>
            {isRevertEligible && (
              <>
                <Button
                  colorPalette="red"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRevertDialogOpen(true)}
                >
                  {t('history.revertClose')}
                </Button>

                <Dialog.Root
                  open={isRevertDialogOpen}
                  onOpenChange={(e) => setIsRevertDialogOpen(e.open)}
                  role="alertdialog"
                >
                  <Dialog.Backdrop />
                  <Dialog.Positioner>
                    <Dialog.Content>
                      <Dialog.Header>
                        <Dialog.Title>{t('history.revertDialog.title')}</Dialog.Title>
                      </Dialog.Header>
                      <Dialog.Body>
                        <Text>{t('history.revertDialog.description', { period: selectedRun.period })}</Text>
                      </Dialog.Body>
                      <Dialog.Footer>
                        <Button variant="outline" onClick={() => setIsRevertDialogOpen(false)}>
                          {t('history.revertDialog.cancel')}
                        </Button>
                        <Button
                          colorPalette="red"
                          loading={revertMutation.isPending}
                          onClick={() => revertMutation.mutate(selectedRunId!)}
                        >
                          {t('history.revertDialog.confirm')}
                        </Button>
                      </Dialog.Footer>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Dialog.Root>
              </>
            )}
            {isRevertEligible && (
              <>
                <Button
                  colorPalette="red"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <LuTrash2 /> {t('history.deletePayroll')}
                </Button>

                <Dialog.Root
                  open={isDeleteDialogOpen}
                  onOpenChange={(e) => setIsDeleteDialogOpen(e.open)}
                  role="alertdialog"
                >
                  <Dialog.Backdrop />
                  <Dialog.Positioner>
                    <Dialog.Content>
                      <Dialog.Header>
                        <Dialog.Title>{t('history.deleteDialog.title')}</Dialog.Title>
                      </Dialog.Header>
                      <Dialog.Body>
                        <Text>{t('history.deleteDialog.description', { period: selectedRun.period })}</Text>
                      </Dialog.Body>
                      <Dialog.Footer>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                          {t('history.deleteDialog.cancel')}
                        </Button>
                        <Button
                          colorPalette="red"
                          loading={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(selectedRunId!)}
                        >
                          {t('history.deleteDialog.confirm')}
                        </Button>
                      </Dialog.Footer>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Dialog.Root>
              </>
            )}
            <Button
              colorPalette="gray"
              variant="outline"
              size="sm"
              onClick={() => handlePrintReport()}
              disabled={runSlips.length === 0}
              loading={isLoadingSlips}
            >
              <Icon as={LuPrinter} mr="1" />
              {t('history.printReport')}
            </Button>
            <Button
              colorPalette="oxygen"
              variant="outline"
              size="sm"
              onClick={() => handlePrintPayslips()}
              disabled={runSlips.length === 0}
              loading={isLoadingSlips}
            >
              <Icon as={LuPrinter} mr="1" />
              {t('history.printPayslips')}
            </Button>
          </HStack>
        </HStack>

        {/* Hidden print templates — display:none on screen, cloned into iframe by react-to-print */}
        <PayslipsPrintTemplate
          ref={printPayslipsRef}
          slips={runSlips}
          period={selectedRun.period}
        />
        <PayrollReportPrintTemplate
          ref={printReportRef}
          slips={runSlips}
          period={selectedRun.period}
          departmentConfig={departmentConfig}
        />

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

          {/* Simple Pagination Controls */}
          <HStack justify="center" mt="4">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Text fontSize="sm">Page {page} of {runList?.totalPages || 1}</Text>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= (runList?.totalPages || 1)}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </HStack>
        </Stack>
      )}
    </Box>
  )
}

const HistoryRunCard = ({ run, onClick }: { run: PayrollRun; onClick: () => void }) => {
  const { t } = useTranslation('payroll')

  // We need slips for printing, but we don't have them in the list view.
  // Strategy: Fetch slips on print click if not available? 
  // For now, we disable printing from list view or fetch them on demand.
  // Actually, let's just remove the hidden print template from list view to avoid eager fetching.
  // Printing should happen in the detailed view.

  // Note: run.totalBasic and run.totalNet should be populated by PocketBase metadata.

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
        </HStack>
      </HStack>

      <HStack gap="8">
        <Box>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" mb="1">{t('run.totalBasic')}</Text>
          <Text fontWeight="bold" fontSize="md" color="gray.700">{formatCurrency(run.totalBasic || 0)}</Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" mb="1">{t('run.totalNet')}</Text>
          <Text fontWeight="bold" fontSize="md" color="green.600">{formatCurrency(run.totalNet || 0)}</Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" mb="1">{t('run.employeesCount')}</Text>
          <Text fontWeight="bold" fontSize="md" color="gray.700">{run.employeeCount || 0}</Text>
        </Box>
      </HStack>
    </Box>
  )
}
