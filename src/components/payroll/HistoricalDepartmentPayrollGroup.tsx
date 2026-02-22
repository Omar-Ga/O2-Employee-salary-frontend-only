import { Box, HStack, Text, Collapsible, IconButton, Badge, Grid, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuChevronDown } from "react-icons/lu"
import { useState } from "react"
import { PayrollSlip } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { PayrollEmployeeCard } from "./PayrollEmployeeCard"

interface HistoricalDepartmentPayrollGroupProps {
    department: { id: string; label: string; colorPalette?: string; subDepartments: { id: string; label: string }[] }
    slips: PayrollSlip[]
}

export const HistoricalDepartmentPayrollGroup = ({
    department,
    slips
}: HistoricalDepartmentPayrollGroupProps) => {
    const { t } = useTranslation('payroll')
    const { t: tEmp } = useTranslation('employees')
    const [isOpen, setIsOpen] = useState(true)

    if (slips.length === 0) return null

    // Calculate parent department totals from historical slips
    const parentTotals = slips.reduce(
        (acc, slip) => ({
            basic: acc.basic + slip.basicSalary,
            net: acc.net + slip.netSalary,
        }),
        { basic: 0, net: 0 }
    )

    const subDeptGroups: { id: string; label: string; slips: PayrollSlip[]; totals: { basic: number; net: number } }[] = []

    department.subDepartments.forEach(sub => {
        const subSlips = slips.filter(s => s.departmentId === sub.id)
        if (subSlips.length > 0) {
            const subTotals = subSlips.reduce(
                (acc, s) => ({
                    basic: acc.basic + s.basicSalary,
                    net: acc.net + s.netSalary,
                }),
                { basic: 0, net: 0 }
            )
            subDeptGroups.push({ id: sub.id, label: sub.label, slips: subSlips, totals: subTotals })
        }
    })

    const otherSlips = slips.filter(s => !department.subDepartments.some(sub => sub.id === s.departmentId))
    if (otherSlips.length > 0) {
        const otherTotals = otherSlips.reduce(
            (acc, s) => ({
                basic: acc.basic + s.basicSalary,
                net: acc.net + s.netSalary,
            }),
            { basic: 0, net: 0 }
        )
        subDeptGroups.push({ id: 'other', label: tEmp('tabs.other_sub', { defaultValue: 'Other' }), slips: otherSlips, totals: otherTotals })
    }

    return (
        <Collapsible.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
            <Box mb="4" borderWidth="1px" borderRadius="xl" overflow="hidden" bg="white">
                <HStack
                    cursor="pointer"
                    onClick={() => setIsOpen(!isOpen)}
                    bg="gray.50"
                    p="3"
                    _hover={{ bg: "gray.100" }}
                    transition="background 0.2s"
                    justify="space-between"
                >
                    <HStack gap="3">
                        <IconButton
                            variant="ghost"
                            size="xs"
                            aria-label="Toggle"
                            transform={isOpen ? "rotate(0deg)" : "rotate(-90deg)"}
                            transition="transform 0.2s"
                            pointerEvents="none"
                        >
                            <LuChevronDown />
                        </IconButton>

                        <Text fontSize="md" fontWeight="bold" color="gray.800">
                            {department.label}
                        </Text>

                        <Badge colorPalette={department.colorPalette || "gray"} variant="subtle" borderRadius="full">
                            {slips.length} {t('run.employeesCount', { defaultValue: 'Employees' })}
                        </Badge>
                    </HStack>

                    <HStack gap="6" pr="4">
                        <Box textAlign="right">
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase">{t('run.totalBasic', { defaultValue: 'Total Basic' })}</Text>
                            <Text fontSize="sm" fontWeight="bold">{formatCurrency(parentTotals.basic)}</Text>
                        </Box>
                        <Box textAlign="right">
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase">{t('run.totalNet', { defaultValue: 'Total Net' })}</Text>
                            <Text fontSize="sm" fontWeight="bold" color="green.600">{formatCurrency(parentTotals.net)}</Text>
                        </Box>
                    </HStack>
                </HStack>

                <Collapsible.Content>
                    <Box animation="fade-in 0.3s">
                        {subDeptGroups.map((group, index) => (
                            <Box key={group.id} borderTopWidth={index === 0 ? "1px" : "1px"} borderColor="gray.100">
                                {department.id !== 'other' && (
                                    <HStack bg="gray.100" p="2" pl="8" justify="space-between" borderBottomWidth="1px" borderColor="gray.200">
                                        <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                                            {group.label}
                                        </Text>
                                        <HStack gap="4" pr="4">
                                            <Text fontSize="xs" color="gray.500">
                                                {t('run.table.basic')}: <Text as="span" fontWeight="bold" color="gray.700">{formatCurrency(group.totals.basic)}</Text>
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">
                                                {t('run.table.netSalary')}: <Text as="span" fontWeight="bold" color="green.600">{formatCurrency(group.totals.net)}</Text>
                                            </Text>
                                        </HStack>
                                    </HStack>
                                )}

                                {/* Card Header for Desktop */}
                                <Grid
                                    templateColumns={{ base: "none", md: "2fr 1fr 1fr 1fr 1fr" }}
                                    gap="4"
                                    px="4"
                                    py="1.5"
                                    bg="white"
                                    borderBottomWidth="1px"
                                    borderColor="gray.100"
                                    display={{ base: "none", md: "grid" }}
                                >
                                    <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase">{t('run.table.employee')}</Text>
                                    <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" textAlign="end">{t('run.table.basic')}</Text>
                                    <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" textAlign="end">{t('run.table.additions')}</Text>
                                    <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" textAlign="end">{t('run.table.deductions')}</Text>
                                    <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" textAlign="end">{t('run.table.netSalary')}</Text>
                                </Grid>

                                <Stack gap="2" p="3" bg="gray.50/50">
                                    {group.slips.map(slip => {
                                        const additions = slip.overtimeAmount + slip.bonusAmount
                                        const deductions = slip.deductionAmount + slip.advanceAmount
                                        return (
                                            <PayrollEmployeeCard
                                                key={slip.id}
                                                name={slip.employeeName || '---'}
                                                jobTitle={slip.employeeJobTitle || '---'}
                                                basicSalary={slip.basicSalary}
                                                additions={additions}
                                                deductions={deductions}
                                                netSalary={slip.netSalary}
                                                isHistorical
                                            />
                                        )
                                    })}
                                </Stack>
                            </Box>
                        ))}
                    </Box>
                </Collapsible.Content>
            </Box>
        </Collapsible.Root>
    )
}
