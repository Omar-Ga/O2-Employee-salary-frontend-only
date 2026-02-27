import {
  Box,
  Button,
  Grid,
  HStack,
  Icon,
  Input,
  Stack,
  Text,
  Separator,
  Textarea,
  Heading,
  Circle,
  VStack,
} from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useState, useMemo, useEffect } from "react"
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from "@/components/ui/drawer"
import { toaster } from "@/components/ui/toaster"
import { payrollService } from "@/services/payroll.service"
import { employeeService } from "@/services/employee.service"
import { transactionService } from "@/services/transaction.service"
import {
  LuTrendingUp,
  LuTrendingDown,
  LuAward,
  LuWallet,
  LuClock,
  LuCalendar,
  LuCheck,
  LuTrash2,
} from "react-icons/lu"
import { TransactionCategory, Transaction } from "@/types"
import { TransactionsCategoryOptions } from "@/types/pocketbase-types"
import { formatCurrency, getCurrencySymbol } from "@/lib/utils"
import { SegmentGroup, IconButton } from "@chakra-ui/react"
import type { IconType } from "react-icons"

interface TransactionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeIds: string[]
  onSuccess: () => void
}

type StagedData = {
  overtime: { amount: number, unit: 'hours' | 'days' },
  deduction: { amount: number, unit: 'hours' | 'days', reason: string },
  bonus: { amount: number, unit: 'cash' },
  advance: { amount: number, unit: 'cash' }
}

const INITIAL_STAGED: StagedData = {
  overtime: { amount: 0, unit: 'hours' },
  deduction: { amount: 0, unit: 'hours', reason: '' },
  bonus: { amount: 0, unit: 'cash' },
  advance: { amount: 0, unit: 'cash' }
}

export const TransactionDrawer = ({ open, onOpenChange, employeeIds, onSuccess }: TransactionDrawerProps) => {
  const { t } = useTranslation('payroll')
  const [activeCategory, setActiveCategory] = useState<TransactionsCategoryOptions>(TransactionsCategoryOptions.overtime)
  const queryClient = useQueryClient()

  // Staged State
  const [staged, setStaged] = useState<StagedData>(INITIAL_STAGED)

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const result = await employeeService.getAll(1, 1000)
      return result.items
    },
  })

  const isBulk = employeeIds.length > 1
  const singleEmployee = useMemo(() =>
    !isBulk && employeeIds.length === 1
      ? employees.find(e => e.id === employeeIds[0])
      : null
    , [employees, employeeIds, isBulk])

  // Load existing transactions for preview
  const { data: existingTransactions = [] } = useQuery({
    queryKey: ['transactions', singleEmployee?.id],
    queryFn: async () => {
      if (!singleEmployee?.id) return []
      const result = await transactionService.getAll(1, 100, singleEmployee.id)
      return result.items
    },
    enabled: !!singleEmployee && open,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: transactionService.createBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toaster.create({
        title: isBulk
          ? t('dialog.toast.bulkAdded', { count: employeeIds.length })
          : t('dialog.toast.added'),
        type: "success"
      })
      onOpenChange(false)
      onSuccess()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: transactionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toaster.create({
        title: t('dialog.toast.removed'),
        type: "success"
      })
    }
  })

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setActiveCategory(TransactionsCategoryOptions.overtime)
      setStaged(JSON.parse(JSON.stringify(INITIAL_STAGED)))
    }
  }, [open])

  // Helpers
  const updateStaged = (key: keyof StagedData, updates: Partial<StagedData[keyof StagedData]>) => {
    setStaged(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }))
  }

  const getType = (cat: TransactionCategory) => {
    if (['overtime', 'bonus'].includes(cat)) return 'addition'
    return 'deduction'
  }

  const handleSubmit = () => {
    const transactionsToCreate: Partial<Transaction>[] = []

    // Iterate through staged data and create transactions for non-zero amounts
    Object.entries(staged).forEach(([cat, data]) => {
      if (data.amount > 0) {
        const type = getType(cat as TransactionCategory)
        const baseTx = {
          category: cat as TransactionCategory,
          type,
          unit: data.unit,
          amount: data.amount,
          reason: cat === 'deduction' ? (data as StagedData['deduction']).reason : undefined,
          date: new Date().toISOString(),
          isClosed: false
        } as Partial<Transaction>

        employeeIds.forEach(id => {
          transactionsToCreate.push({
            ...baseTx,
            employeeId: id
          })
        })
      }
    })

    if (transactionsToCreate.length === 0) {
      onOpenChange(false)
      return
    }

    createMutation.mutate(transactionsToCreate)
  }

  // Live Calculation Preview
  const projectedSlip = useMemo(() => {
    if (!singleEmployee) return null

    // Convert staged data into temporary transaction objects
    const stagedTransactions = Object.entries(staged)
      .filter(([_, data]) => data.amount > 0)
      .map(([cat, data]) => ({
        category: cat,
        type: getType(cat as TransactionCategory),
        unit: data.unit,
        amount: data.amount,
        employeeId: singleEmployee.id,
        isClosed: false
      })) as unknown as Transaction[]

    return payrollService.calculateSlip(singleEmployee, [...existingTransactions, ...stagedTransactions])
  }, [singleEmployee, staged, existingTransactions])

  const hasChanges = Object.values(staged).some(v => v.amount > 0)

  return (
    <DrawerRoot
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="bottom"
    >
      <DrawerBackdrop />
      <DrawerContent
        borderTopRadius="2xl"
        maxH="90vh"
        overflow="hidden"
        boxShadow="0 -10px 40px rgba(0,0,0,0.1)"
      >
        <DrawerHeader borderBottomWidth="1px" py="4">
          <HStack justify="space-between" align="center">
            <VStack align="flex-start" gap="0">
              <DrawerTitle fontSize="xl" fontWeight="bold">
                {isBulk
                  ? t('dialog.titleBulk', { count: employeeIds.length })
                  : t('dialog.title', { name: singleEmployee?.name })}
              </DrawerTitle>
              {!isBulk && singleEmployee && (
                <Text fontSize="sm" color="gray.500">{singleEmployee.jobTitle} • {singleEmployee.department}</Text>
              )}
            </VStack>
            <HStack gap="3">
              <Button variant="ghost" onClick={() => onOpenChange(false)} size="sm">
                {t('dialog.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                colorPalette="oxygen"
                size="md"
                px="8"
                disabled={!hasChanges}
                loading={createMutation.isPending}
              >
                <LuCheck /> {t('dialog.save')}
              </Button>
            </HStack>
          </HStack>
        </DrawerHeader>

        <DrawerBody p="0" overflow="hidden">
          <Grid templateColumns={{ base: "1fr", md: "350px 1fr" }} h="full" maxH="calc(90vh - 73px)">
            {/* Left Panel: Context & Live Stats */}
            <Box bg="gray.50" p="8" borderRightWidth="1px" overflowY="auto" h="full">
              <Stack gap="8">
                <Box>
                  <Heading size="xs" color="gray.500" textTransform="uppercase" mb="4" letterSpacing="widest">
                    {t('preview.currentSalary')}
                  </Heading>
                  <Box
                    p="5"
                    bg="white"
                    borderRadius="xl"
                    borderWidth="1px"
                    shadow="sm"
                    position="relative"
                    overflow="hidden"
                  >
                    <Text fontSize="2xl" fontWeight="black" color="gray.800" mb="2">
                      {singleEmployee ? formatCurrency(singleEmployee.monthlySalary) : "---"}
                    </Text>
                    <Text fontSize="xs" color="gray.400" mt="1">{t('preview.baseSalary')}</Text>
                    <Box position="absolute" top="-2" right="-2" opacity="0.05">
                      <Icon as={LuWallet} boxSize="20" />
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <HStack justify="space-between" align="center" mb="4">
                    <Heading size="xs" color="gray.500" textTransform="uppercase" letterSpacing="widest">
                      {t('preview.projectedNet')}
                    </Heading>
                    {projectedSlip && projectedSlip.netSalary > singleEmployee!.monthlySalary && (
                      <Icon as={LuTrendingUp} color="green.500" />
                    )}
                    {projectedSlip && projectedSlip.netSalary < singleEmployee!.monthlySalary && (
                      <Icon as={LuTrendingDown} color="red.500" />
                    )}
                  </HStack>
                  <Box
                    p="6"
                    bg="oxygen.50"
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor="oxygen.200"
                    shadow="md"
                    position="relative"
                    overflow="hidden"
                  >
                    <Text fontSize="3xl" fontWeight="black" color="oxygen.700" mb="2">
                      {projectedSlip ? formatCurrency(projectedSlip.netSalary) : "---"}
                    </Text>
                    <Text fontSize="xs" color="oxygen.600" fontWeight="bold" mt="1">{t('preview.afterDeductions')}</Text>
                    <Box position="absolute" top="-2" right="-2" opacity="0.1">
                      <Icon as={LuTrendingUp} boxSize="24" />
                    </Box>
                  </Box>
                </Box>

                {projectedSlip && (
                  <Stack gap="2">
                    <HStack justify="space-between" fontSize="sm">
                      <Text color="gray.500">{t('preview.totalAdditions')}</Text>
                      <Text color="green.600" fontWeight="bold">+{formatCurrency(projectedSlip.overtimeAmount + projectedSlip.bonusAmount)}</Text>
                    </HStack>
                    <HStack justify="space-between" fontSize="sm">
                      <Text color="gray.500">{t('preview.totalDeductions')}</Text>
                      <Text color="red.600" fontWeight="bold">-{formatCurrency(projectedSlip.deductionAmount + projectedSlip.advanceAmount)}</Text>
                    </HStack>
                    <Separator />
                    <HStack justify="space-between" fontSize="sm" fontWeight="bold">
                      <Text color="gray.700">{t('preview.hourlyRate')}</Text>
                      <Text color="gray.700">{formatCurrency(singleEmployee!.monthlySalary / singleEmployee!.workHours)}{t('units.perHour')}</Text>
                    </HStack>
                  </Stack>
                )}
              </Stack>
            </Box>

            {/* Right Panel: Interactive Forms */}
            <Box p="8" overflowY="auto" h="full">
              <Stack gap="8">
                <Box>
                  <Heading size="sm" mb="6" color="gray.700">{t('dialog.selectType')}</Heading>
                  <Grid templateColumns="repeat(4, 1fr)" gap="4">
                    <TypeButton
                      active={activeCategory === TransactionsCategoryOptions.overtime}
                      onClick={() => setActiveCategory(TransactionsCategoryOptions.overtime)}
                      icon={LuClock}
                      label={t('categories.overtime')}
                      color="green"
                      badgeCount={staged.overtime.amount > 0 ? staged.overtime.amount : undefined}
                    />
                    <TypeButton
                      active={activeCategory === TransactionsCategoryOptions.deduction}
                      onClick={() => setActiveCategory(TransactionsCategoryOptions.deduction)}
                      icon={LuTrendingDown}
                      label={t('categories.deduction')}
                      color="red"
                      badgeCount={staged.deduction.amount > 0 ? staged.deduction.amount : undefined}
                    />
                    <TypeButton
                      active={activeCategory === TransactionsCategoryOptions.bonus}
                      onClick={() => setActiveCategory(TransactionsCategoryOptions.bonus)}
                      icon={LuAward}
                      label={t('categories.bonus')}
                      color="blue"
                      badgeCount={staged.bonus.amount > 0 ? 1 : undefined} // Just show a badge if amount > 0
                    />
                    <TypeButton
                      active={activeCategory === TransactionsCategoryOptions.advance}
                      onClick={() => setActiveCategory(TransactionsCategoryOptions.advance)}
                      icon={LuWallet}
                      label={t('categories.advance')}
                      color="orange"
                      badgeCount={staged.advance.amount > 0 ? 1 : undefined}
                    />
                  </Grid>
                </Box>

                <HStack align="flex-end" gap="8">
                  <Stack flex="1" gap="4">
                    <HStack justify="space-between">
                      <Heading size="sm" color="gray.700">{t('dialog.entryAmount')}</Heading>
                      {['overtime', 'deduction'].includes(activeCategory) && (
                        <SegmentGroup.Root
                          size="sm"
                          value={staged[activeCategory as 'overtime' | 'deduction'].unit}
                          onValueChange={(e) => updateStaged(activeCategory as 'overtime' | 'deduction', { unit: e.value as 'hours' | 'days' })}
                        >
                          <SegmentGroup.Indicator />
                          <SegmentGroup.Item value="hours">
                            <SegmentGroup.ItemText fontSize="xs"><LuClock style={{ display: 'inline', marginRight: '4px' }} /> {t('units.hours')}</SegmentGroup.ItemText>
                            <SegmentGroup.ItemHiddenInput />
                          </SegmentGroup.Item>
                          <SegmentGroup.Item value="days">
                            <SegmentGroup.ItemText fontSize="xs"><LuCalendar style={{ display: 'inline', marginRight: '4px' }} /> {t('units.days')}</SegmentGroup.ItemText>
                            <SegmentGroup.ItemHiddenInput />
                          </SegmentGroup.Item>
                        </SegmentGroup.Root>
                      )}
                    </HStack>

                    <Box position="relative">
                      <Input
                        size="xl"
                        type="number"
                        value={staged[activeCategory].amount || ''}
                        onChange={e => updateStaged(activeCategory, { amount: Number(e.target.value) })}
                        placeholder="0.00"
                        fontSize="3xl"
                        fontWeight="black"
                        h="80px"
                        pl="12"
                        borderRadius="2xl"
                        borderColor="gray.200"
                        _focus={{ borderColor: "oxygen.500", ring: "2px", ringColor: "oxygen.100" }}
                      />
                      <Box position="absolute" left="4" top="50%" transform="translateY(-50%)" color="gray.400">
                        {['bonus', 'advance'].includes(activeCategory) ? <Text fontWeight="bold">{getCurrencySymbol()}</Text> : <Icon as={staged[activeCategory as 'overtime' | 'deduction'].unit === 'hours' ? LuClock : LuCalendar} />}
                      </Box>
                    </Box>
                  </Stack>

                  {activeCategory === 'deduction' && (
                    <Stack flex="1.5" gap="4">
                      <Heading size="sm" color="gray.700">{t('dialog.reason')}</Heading>
                      <Textarea
                        value={staged.deduction.reason}
                        onChange={e => updateStaged('deduction', { reason: e.target.value })}
                        placeholder={t('dialog.reasonPlaceholder')}
                        h="80px"
                        borderRadius="2xl"
                        resize="none"
                      />
                    </Stack>
                  )}
                </HStack>

                <Box p="4" bg="blue.50" borderRadius="xl" borderLeftWidth="4px" borderColor="blue.400">
                  <HStack color="blue.700" gap="3">
                    <Icon as={LuCheck} />
                    <Text fontSize="sm" fontWeight="medium">
                      {isBulk
                        ? t('preview.bulkSummary', { count: employeeIds.length, category: t(`categories.${activeCategory}`) })
                        : t('preview.impactDescription', {
                          category: t(`categories.${activeCategory}`),
                          amount: staged[activeCategory].unit === 'cash' ? formatCurrency(staged[activeCategory].amount) : staged[activeCategory].amount,
                          unit: staged[activeCategory].unit === 'cash' ? '' : t(`units.${staged[activeCategory].unit}`)
                        })}
                    </Text>
                  </HStack>
                </Box>

                {!isBulk && existingTransactions.length > 0 && (
                  <Box>
                    <Heading size="sm" mb="4" color="gray.700">{t('dialog.activeTransactions')}</Heading>
                    <Box
                      maxH="280px"
                      overflowY="auto"
                      pr="2"
                      css={{
                        "&::-webkit-scrollbar": { width: "4px" },
                        "&::-webkit-scrollbar-track": { bg: "transparent" },
                        "&::-webkit-scrollbar-thumb": { bg: "gray.200", borderRadius: "full" },
                      }}
                    >
                      <Stack gap="2">
                        {existingTransactions.map((tx) => (
                          <HStack
                            key={tx.id}
                            p="3"
                            bg="white"
                            borderWidth="1px"
                            borderRadius="xl"
                            justify="space-between"
                            animation="slide-in-bottom 0.2s ease-out"
                          >
                            <HStack gap="3">
                              <Circle size="8" bg={tx.type === 'addition' ? "green.50" : "red.50"}>
                                <Icon
                                  as={tx.category === 'overtime' ? LuClock : tx.category === 'bonus' ? LuAward : tx.category === 'advance' ? LuWallet : LuTrendingDown}
                                  color={tx.type === 'addition' ? "green.500" : "red.500"}
                                  boxSize="4"
                                />
                              </Circle>
                              <Box>
                                <Text fontSize="sm" fontWeight="bold" color="gray.700">{t(`categories.${tx.category}`)}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {tx.unit === 'cash' ? formatCurrency(tx.amount) : `${tx.amount} ${t(`units.${tx.unit}`)}`}
                                </Text>
                              </Box>
                            </HStack>
                            <IconButton
                              variant="ghost"
                              size="sm"
                              colorPalette="red"
                              onClick={() => deleteMutation.mutate(tx.id)}
                              loading={deleteMutation.isPending && deleteMutation.variables === tx.id}
                              aria-label={t('dialog.actions.delete')}
                            >
                              <LuTrash2 />
                            </IconButton>
                          </HStack>
                        ))}
                      </Stack>
                    </Box>
                  </Box>
                )}
                {!isBulk && existingTransactions.length === 0 && (
                  <Text fontSize="sm" color="gray.400" textAlign="center" py="4" borderStyle="dashed" borderWidth="2px" borderColor="gray.100" borderRadius="xl">
                    {t('dialog.noTransactions')}
                  </Text>
                )}
              </Stack>
            </Box>
          </Grid>
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  )
}

interface TypeButtonProps {
  active: boolean
  onClick: () => void
  icon: IconType
  label: string
  color: string
  badgeCount?: number
}

const TypeButton = ({ active, onClick, icon, label, color, badgeCount }: TypeButtonProps) => {
  return (
    <Button
      h="auto"
      py="6"
      flexDirection="column"
      gap="3"
      variant={active ? "solid" : "outline"}
      colorPalette={active ? color : "gray"}
      borderColor={active ? `${color}.500` : "gray.200"}
      bg={active ? `${color}.500` : "white"}
      _hover={{ bg: active ? `${color}.600` : "gray.50", transform: "translateY(-2px)" }}
      transition="all 0.2s"
      onClick={onClick}
      borderRadius="2xl"
      shadow={active ? "md" : "none"}
      position="relative"
    >
      <Circle size="10" bg={active ? "whiteAlpha.300" : `${color}.50`}>
        <Icon as={icon} color={active ? "white" : `${color}.500`} />
      </Circle>
      <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
        {label}
      </Text>

      {/* Active Indicator Check */}
      {active && (
        <Box position="absolute" top="2" right="2">
          <Circle size="4" bg="white">
            <Icon as={LuCheck} boxSize="3" color={`${color}.500`} />
          </Circle>
        </Box>
      )}

      {/* Staged Data Badge */}
      {!active && badgeCount !== undefined && (
        <Box position="absolute" top="-2" right="-2">
          <Circle size="6" bg={`${color}.500`} color="white" border="2px solid white">
            <Text fontSize="xs" fontWeight="bold">{typeof badgeCount === 'number' && badgeCount > 9 ? '9+' : badgeCount}</Text>
          </Circle>
        </Box>
      )}
    </Button>
  )
}
