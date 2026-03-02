import { Box, HStack, Text, Collapsible, IconButton, Badge, Grid, Stack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuChevronDown } from "react-icons/lu"
import { useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { PayrollEmployeeCard } from "./PayrollEmployeeCard"
import type { PreviewDepartmentGroup } from "@/services/payroll.service"

interface PreviewDepartmentPayrollGroupProps {
    group: PreviewDepartmentGroup
    onManage: (employeeId: string) => void
}

/**
 * Renders a department payroll group using pre-calculated data from the backend.
 * Zero client-side math — the backend is the Single Source of Truth.
 */
export const PreviewDepartmentPayrollGroup = ({
    group,
    onManage
}: PreviewDepartmentPayrollGroupProps) => {
    const { t } = useTranslation('payroll')
    const [isOpen, setIsOpen] = useState(true)

    if (group.employeeCount === 0) return null

    return (
        <Collapsible.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
            <Box mb="4" borderWidth="1px" borderRadius="xl" overflow="hidden" bg="white">
                {/* Parent Department Header */}
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
                            {group.label}
                        </Text>

                        <Badge colorPalette="gray" variant="subtle" borderRadius="full">
                            {group.employeeCount} {t('run.employeesCount', { defaultValue: 'Employees' })}
                        </Badge>
                    </HStack>

                    <HStack gap="6" pr="4">
                        <Box textAlign="right">
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase">{t('run.totalBasic', { defaultValue: 'Total Basic' })}</Text>
                            <Text fontSize="sm" fontWeight="bold">{formatCurrency(group.totalBasic)}</Text>
                        </Box>
                        <Box textAlign="right">
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase">{t('run.totalNet', { defaultValue: 'Total Net' })}</Text>
                            <Text fontSize="sm" fontWeight="bold" color="green.600">{formatCurrency(group.totalNet)}</Text>
                        </Box>
                    </HStack>
                </HStack>

                {/* Content */}
                <Collapsible.Content>
                    <Box animation="fade-in 0.3s">
                        {group.subGroups.map((sub, index) => (
                            <Box key={sub.id} borderTopWidth={index === 0 ? "1px" : "1px"} borderColor="gray.100">
                                {/* Sub-department Header */}
                                {group.id !== 'other' && (
                                    <HStack bg="gray.100" p="2" pl="8" justify="space-between" borderBottomWidth="1px" borderColor="gray.200">
                                        <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                                            {sub.label}
                                        </Text>
                                        <HStack gap="4" pr="4">
                                            <Text fontSize="xs" color="gray.500">
                                                {t('run.table.basic')}: <Text as="span" fontWeight="bold" color="gray.700">{formatCurrency(sub.totalBasic)}</Text>
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">
                                                {t('run.table.netSalary')}: <Text as="span" fontWeight="bold" color="green.600">{formatCurrency(sub.totalNet)}</Text>
                                            </Text>
                                        </HStack>
                                    </HStack>
                                )}

                                {/* Card Header for Desktop */}
                                <Grid
                                    templateColumns={{ base: "none", md: "2fr 1fr 1fr 1fr 1fr 100px" }}
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
                                    <Box />
                                </Grid>

                                <Stack gap="2" p="3" bg="gray.50/50">
                                    {sub.slips.map(slip => (
                                        <PayrollEmployeeCard
                                            key={slip.employeeId}
                                            name={slip.name}
                                            jobTitle={slip.jobTitle}
                                            basicSalary={slip.basicSalary}
                                            additions={slip.additions}
                                            deductions={slip.deductions}
                                            netSalary={slip.netSalary}
                                            onManage={() => onManage(slip.employeeId)}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        ))}
                    </Box>
                </Collapsible.Content>
            </Box>
        </Collapsible.Root>
    )
}
