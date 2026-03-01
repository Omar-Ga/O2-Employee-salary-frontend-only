import { Box, VStack, HStack, Text, Flex, Grid } from "@chakra-ui/react"
import { forwardRef } from "react"
import { useTranslation } from "react-i18next"
import { DateTime } from "luxon"
import { PayrollSlip } from "@/types"
import { formatCurrency } from "@/lib/utils"

interface PayslipsPrintTemplateProps {
    slips: PayrollSlip[]
    period: string
}

export const PayslipsPrintTemplate = forwardRef<HTMLDivElement, PayslipsPrintTemplateProps>(
    ({ slips, period }, ref) => {
        const { t, i18n } = useTranslation('payroll')
        const isRTL = i18n.dir() === 'rtl'

        // Date formatting
        const formattedPeriod = period ? DateTime.fromFormat(period, 'yyyy-MM').setLocale(i18n.language).toFormat('MMMM yyyy') : period
        const printDate = DateTime.now().setLocale(i18n.language).toFormat('yyyy-MM-dd HH:mm')

        return (
            <Box
                ref={ref}
                className="print-container"
                dir={isRTL ? "rtl" : "ltr"}
                css={{
                    "@media print": {
                        display: "block",
                        margin: 0,
                        padding: 0,
                        "& .payslip-page": {
                            pageBreakAfter: "always",
                        }
                    },
                    display: "none", // Hidden on screen, only visible in print via react-to-print's clone component logic
                }}
            >
                <style type="text/css" media="print">
                    {`
            @page { size: A4 portrait; margin: 0; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; direction: ${isRTL ? 'rtl' : 'ltr'}; }
          `}
                </style>

                {/* We need to group slips into pairs for each A4 page */}
                {Array.from({ length: Math.ceil(slips.length / 2) }).map((_, pageIndex) => {
                    const pageSlips = slips.slice(pageIndex * 2, pageIndex * 2 + 2)

                    return (
                        <Flex
                            key={pageIndex}
                            direction="column"
                            height="297mm" // A4 height
                            width="210mm"  // A4 width
                            bg="white"
                            className="payslip-page"
                            mx="auto" // For debugging if we remove display:none
                        >
                            {pageSlips.map((slip, index) => {
                                const employeeName = slip.employeeName || "Unknown Employee"
                                const jobTitle = slip.employeeJobTitle || ""

                                const overtimeAmount = slip.overtimeAmount ?? 0
                                const bonusAmount = slip.bonusAmount ?? 0
                                const deductionAmount = slip.deductionAmount ?? 0
                                const advanceAmount = slip.advanceAmount ?? 0
                                const totalAdditions = overtimeAmount + bonusAmount
                                const totalDeductions = deductionAmount + advanceAmount

                                return (
                                    <Box
                                        key={slip.id}
                                        height="50%"
                                        p="4"
                                        boxSizing="border-box"
                                        borderBottom={index === 0 ? "1px dashed #cbd5e0" : "none"}
                                        display="flex"
                                        flexDirection="column"
                                    >
                                        {/* Header */}
                                        <Box textAlign="center" mb="2">
                                            <Text fontSize="xl" fontWeight="black" letterSpacing="widest" color="gray.800">
                                                SKYCOURT
                                            </Text>
                                            <Text fontSize="sm" color="gray.500" mt="1">{t('payslip.title', { defaultValue: 'Payslip' })} - {formattedPeriod}</Text>
                                        </Box>

                                        {/* Employee Info */}
                                        <HStack justify="space-between" mb="2" pb="2" borderBottomWidth="1px" borderColor="gray.100">
                                            <Box>
                                                <Text fontSize="sm" color="gray.500" textTransform="uppercase" lineHeight="1">{t('payslip.employeeName', { defaultValue: 'Employee Name' })}</Text>
                                                <Text fontSize="md" fontWeight="bold" color="gray.800">{employeeName}</Text>
                                                <Text fontSize="xs" color="gray.500">{jobTitle}</Text>
                                            </Box>
                                            <Box textAlign="end">
                                                <Text fontSize="sm" color="gray.500" textTransform="uppercase" lineHeight="1">{t('payslip.period', { defaultValue: 'Period' })}</Text>
                                                <Text fontSize="sm" fontWeight="bold" color="gray.800">{formattedPeriod}</Text>
                                                <HStack gap="1" justify="flex-end" mt="1">
                                                    <Text fontSize="9px" color="gray.400" textTransform="uppercase">{t('payslip.printDate', { defaultValue: 'Print Date' })}:</Text>
                                                    <Text fontSize="9px" color="gray.500" fontWeight="medium">{printDate}</Text>
                                                </HStack>
                                            </Box>
                                        </HStack>

                                        {/* Basic / Net Salary */}
                                        <Grid templateColumns="1fr 1fr" gap="4" alignItems="start">
                                            <VStack align="stretch" gap="2">
                                                <HStack justify="space-between" bg="gray.50" py="2" px="3" borderRadius="md">
                                                    <Text fontSize="sm" fontWeight="bold" color="gray.700">{t('payslip.basicSalary', { defaultValue: 'Basic Salary' })}</Text>
                                                    <Text fontSize="sm" fontWeight="bold" color="gray.800">{formatCurrency(slip.basicSalary)}</Text>
                                                </HStack>
                                            </VStack>

                                            <VStack align="stretch" gap="2">
                                                <HStack justify="space-between" bg="green.50" py="2" px="3" borderRadius="md" border="1px solid" borderColor="green.200">
                                                    <Text fontSize="sm" fontWeight="bold" color="green.800">{t('payslip.netSalary', { defaultValue: 'Net Salary' })}</Text>
                                                    <Text fontSize="md" fontWeight="black" color="green.800">{formatCurrency(slip.netSalary)}</Text>
                                                </HStack>
                                            </VStack>
                                        </Grid>

                                        {/* Financial Breakdown */}
                                        <Box mt="3" p="3" borderWidth="1px" borderColor="gray.100" borderRadius="lg" bg="gray.50/30">
                                            <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" mb="2" letterSpacing="widest">
                                                {t('payslip.breakdown', { defaultValue: 'Financial Breakdown' })}
                                            </Text>
                                            <Grid templateColumns="1fr 1fr" gap="6" alignItems="start">
                                                {/* Additions */}
                                                <VStack align="stretch" gap="2">
                                                    <Text fontSize="xs" fontWeight="semibold" color="green.700" textTransform="uppercase" letterSpacing="wide" mb="1">
                                                        {t('payslip.additions', { defaultValue: 'Additions' })}
                                                    </Text>
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm" color="gray.600">{t('payslip.overtime', { defaultValue: 'Overtime' })}</Text>
                                                        <Text fontSize="sm" fontWeight="medium" color="green.700" dir="ltr">+{formatCurrency(overtimeAmount)}</Text>
                                                    </HStack>
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm" color="gray.600">{t('payslip.bonus', { defaultValue: 'Bonus' })}</Text>
                                                        <Text fontSize="sm" fontWeight="medium" color="green.700" dir="ltr">+{formatCurrency(bonusAmount)}</Text>
                                                    </HStack>
                                                    <HStack justify="space-between" borderTopWidth="1px" borderColor="gray.200" pt="1" mt="1">
                                                        <Text fontSize="xs" color="gray.500">{t('payslip.totalAdditions', { defaultValue: 'Total Additions' })}</Text>
                                                        <Text fontSize="xs" fontWeight="bold" color="green.700" dir="ltr">+{formatCurrency(totalAdditions)}</Text>
                                                    </HStack>
                                                </VStack>

                                                {/* Deductions */}
                                                <VStack align="stretch" gap="2">
                                                    <Text fontSize="xs" fontWeight="semibold" color="red.700" textTransform="uppercase" letterSpacing="wide" mb="1">
                                                        {t('payslip.deductionsList', { defaultValue: 'Deductions' })}
                                                    </Text>
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm" color="gray.600">{t('payslip.deduction', { defaultValue: 'Deduction' })}</Text>
                                                        <Text fontSize="sm" fontWeight="medium" color="red.600" dir="ltr">-{formatCurrency(deductionAmount)}</Text>
                                                    </HStack>
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm" color="gray.600">{t('payslip.advance', { defaultValue: 'Advance (Loan)' })}</Text>
                                                        <Text fontSize="sm" fontWeight="medium" color="red.600" dir="ltr">-{formatCurrency(advanceAmount)}</Text>
                                                    </HStack>
                                                    <HStack justify="space-between" borderTopWidth="1px" borderColor="gray.200" pt="1" mt="1">
                                                        <Text fontSize="xs" color="gray.500">{t('payslip.totalDeductions', { defaultValue: 'Total Deductions' })}</Text>
                                                        <Text fontSize="xs" fontWeight="bold" color="red.600" dir="ltr">-{formatCurrency(totalDeductions)}</Text>
                                                    </HStack>
                                                </VStack>
                                            </Grid>
                                        </Box>

                                        <Box mb="auto" />


                                        {/* Footer / Signatures */}
                                        <HStack justify="space-between" mt="auto" pt="2" borderTopWidth="1px" borderColor="gray.100">
                                            <Box pb="2">
                                                <Text fontSize="10px" color="gray.400" mb="4">{t('payslip.employeeSignature', { defaultValue: 'Employee Signature' })}:</Text>
                                                <Box borderBottom="1px solid" borderColor="gray.800" w="120px"></Box>
                                            </Box>

                                            <Box w="120px" h="60px" />
                                        </HStack>
                                    </Box>
                                )
                            })}
                        </Flex>
                    )
                })}
            </Box>
        )
    }
)

PayslipsPrintTemplate.displayName = "PayslipsPrintTemplate"
