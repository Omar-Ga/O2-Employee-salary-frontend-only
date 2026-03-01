import { Box, Text } from "@chakra-ui/react"
import { forwardRef, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DateTime } from "luxon"
import { PayrollSlip } from "@/types"
import { DepartmentConfig } from "@/lib/departments"
import { formatCurrency } from "@/lib/utils"

interface PayrollReportPrintTemplateProps {
    slips: PayrollSlip[]
    period: string
    departmentConfig: DepartmentConfig[]
}

export const PayrollReportPrintTemplate = forwardRef<HTMLDivElement, PayrollReportPrintTemplateProps>(
    ({ slips, period, departmentConfig }, ref) => {
        const { t, i18n } = useTranslation('payroll')
        const isRTL = i18n.dir() === 'rtl'

        // Date formatting
        const formattedPeriod = period ? DateTime.fromFormat(period, 'yyyy-MM').setLocale(i18n.language).toFormat('MMMM yyyy') : period
        const printDate = DateTime.now().setLocale(i18n.language).toFormat('yyyy-MM-dd HH:mm')

        // Hierarchical Grouping: Parent -> Child -> Slips
        const groupedData = useMemo(() => {
            const data: { parent: DepartmentConfig; children: { child: { id: string, label: string } | null; slips: PayrollSlip[] }[] }[] = []

            departmentConfig.forEach(parent => {
                const parentGroup: { parent: DepartmentConfig; children: { child: { id: string, label: string } | null; slips: PayrollSlip[] }[] } = {
                    parent: parent,
                    children: []
                }

                parent.subDepartments.forEach(child => {
                    const childSlips = slips.filter(s => s.departmentId === child.id)
                    if (childSlips.length > 0) {
                        parentGroup.children.push({ child, slips: childSlips })
                    }
                })

                // Employees directly under parent (if any) or missing child association
                const directSlips = slips.filter(s => s.departmentId === parent.id)
                if (directSlips.length > 0) {
                    parentGroup.children.push({ child: null, slips: directSlips })
                }

                if (parentGroup.children.length > 0) {
                    data.push(parentGroup)
                }
            })

            return data
        }, [slips, departmentConfig])

        // Overall Grand Totals
        const grandTotals = useMemo(() => {
            return slips.reduce((acc, slip) => ({
                additions: acc.additions + (slip.overtimeAmount || 0) + (slip.bonusAmount || 0),
                deductions: acc.deductions + (slip.deductionAmount || 0),
                loans: acc.loans + (slip.advanceAmount || 0),
                gross: acc.gross + slip.basicSalary + (slip.overtimeAmount || 0) + (slip.bonusAmount || 0),
                net: acc.net + slip.netSalary
            }), { additions: 0, deductions: 0, loans: 0, gross: 0, net: 0 })
        }, [slips])

        return (
            <Box
                ref={ref}
                className="print-report-container"
                dir={isRTL ? "rtl" : "ltr"}
                css={{
                    "@media print": {
                        display: "block",
                        margin: 0,
                        padding: "10mm",
                        pageBreakAfter: "auto",
                    },
                    display: "none", // Hidden on screen
                }}
            >
                <style type="text/css" media="print">
                    {`
            @page { size: A4 landscape; margin: 0; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: sans-serif; direction: ${isRTL ? 'rtl' : 'ltr'}; }
            .avoid-break { break-inside: avoid; }
            table { width: 100%; border-collapse: collapse; font-size: 10pt; }
            th, td { border: 1px solid #cbd5e0; padding: 4px 8px; text-align: ${isRTL ? 'right' : 'left'}; }
            th { background-color: #f7fafc; font-weight: bold; }
            .parent-header { background-color: #e2e8f0; font-weight: bold; font-size: 11pt; }
            .child-header { background-color: #edf2f7; font-weight: bold; }
            .subtotal-row { font-weight: bold; background-color: #f7fafc; }
            .grand-total-row { font-weight: bold; background-color: #e2e8f0; font-size: 11pt; }
            .number-cell { text-align: ${isRTL ? 'left' : 'right'} !important; direction: ltr; }
          `}
                </style>

                <Box textAlign="center" mb="6" className="avoid-break">
                    <Text fontSize="2xl" fontWeight="black" letterSpacing="widest" color="gray.800">
                        SKYCOURT
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" mt="1">{t('report.title')}</Text>
                    <Text fontSize="sm" color="gray.600">{formattedPeriod}</Text>
                    <Text fontSize="xs" color="gray.400" mt="1">{t('report.printDate')}: {printDate}</Text>
                </Box>

                <table>
                    <thead>
                        <tr>
                            <th>{t('report.employeeName')}</th>
                            <th>{t('report.jobTitle')}</th>
                            <th className="number-cell">{t('report.additions')}</th>
                            <th className="number-cell">{t('report.deductions')}</th>
                            <th className="number-cell">{t('report.loans')}</th>
                            <th className="number-cell">{t('report.grossSalary')}</th>
                            <th className="number-cell">{t('report.netSalary')}</th>
                            <th>{t('report.signature')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedData.map(({ parent, children }) => {
                            // Calculate parent totals
                            const parentTotals = children.flatMap(c => c.slips).reduce((acc, slip) => ({
                                additions: acc.additions + (slip.overtimeAmount || 0) + (slip.bonusAmount || 0),
                                deductions: acc.deductions + (slip.deductionAmount || 0),
                                loans: acc.loans + (slip.advanceAmount || 0),
                                gross: acc.gross + slip.basicSalary + (slip.overtimeAmount || 0) + (slip.bonusAmount || 0),
                                net: acc.net + slip.netSalary
                            }), { additions: 0, deductions: 0, loans: 0, gross: 0, net: 0 })

                            return (
                                <optgroup key={parent.id} className="avoid-break" style={{ display: 'contents' }}>
                                    <tr>
                                        <td colSpan={8} className="parent-header">{parent.label}</td>
                                    </tr>

                                    {children.map(({ child, slips }) => {
                                        // Calculate child subtotals
                                        const childTotals = slips.reduce((acc, slip) => ({
                                            additions: acc.additions + (slip.overtimeAmount || 0) + (slip.bonusAmount || 0),
                                            deductions: acc.deductions + (slip.deductionAmount || 0),
                                            loans: acc.loans + (slip.advanceAmount || 0),
                                            gross: acc.gross + slip.basicSalary + (slip.overtimeAmount || 0) + (slip.bonusAmount || 0),
                                            net: acc.net + slip.netSalary
                                        }), { additions: 0, deductions: 0, loans: 0, gross: 0, net: 0 })

                                        return (
                                            <optgroup key={child?.id || 'direct'} className="avoid-break" style={{ display: 'contents' }}>
                                                {/* Child Separator */}
                                                <tr>
                                                    <td colSpan={8} className="child-header">
                                                        {child ? child.label : t('tabs.other', { ns: 'employees', defaultValue: 'Other' })}
                                                    </td>
                                                </tr>

                                                {/* Employee Rows */}
                                                {slips.map(slip => {
                                                    const totalAdditions = (slip.overtimeAmount || 0) + (slip.bonusAmount || 0)
                                                    const totalDeductions = (slip.deductionAmount || 0)
                                                    const totalLoans = (slip.advanceAmount || 0)
                                                    const gross = slip.basicSalary + totalAdditions

                                                    return (
                                                        <tr key={slip.id} className="avoid-break">
                                                            <td>{slip.employeeName}</td>
                                                            <td>{slip.employeeJobTitle}</td>
                                                            <td className="number-cell">{formatCurrency(totalAdditions)}</td>
                                                            <td className="number-cell">{formatCurrency(totalDeductions)}</td>
                                                            <td className="number-cell">{formatCurrency(totalLoans)}</td>
                                                            <td className="number-cell">{formatCurrency(gross)}</td>
                                                            <td className="number-cell">{formatCurrency(slip.netSalary)}</td>
                                                            <td></td>
                                                        </tr>
                                                    )
                                                })}

                                                {/* Subtotal child row */}
                                                <tr className="subtotal-row avoid-break">
                                                    <td colSpan={2} style={{ textAlign: isRTL ? 'left' : 'right' }}>
                                                        {t('report.subtotal')}
                                                    </td>
                                                    <td className="number-cell">{formatCurrency(childTotals.additions)}</td>
                                                    <td className="number-cell">{formatCurrency(childTotals.deductions)}</td>
                                                    <td className="number-cell">{formatCurrency(childTotals.loans)}</td>
                                                    <td className="number-cell">{formatCurrency(childTotals.gross)}</td>
                                                    <td className="number-cell">{formatCurrency(childTotals.net)}</td>
                                                    <td></td>
                                                </tr>
                                            </optgroup>
                                        )
                                    })}

                                    {/* Subtotal parent row */}
                                    <tr className="subtotal-row avoid-break">
                                        <td colSpan={2} style={{ textAlign: isRTL ? 'left' : 'right', borderTop: '2px solid #a0aec0' }}>
                                            {t('report.parentTotal')}
                                        </td>
                                        <td className="number-cell" style={{ borderTop: '2px solid #a0aec0' }}>{formatCurrency(parentTotals.additions)}</td>
                                        <td className="number-cell" style={{ borderTop: '2px solid #a0aec0' }}>{formatCurrency(parentTotals.deductions)}</td>
                                        <td className="number-cell" style={{ borderTop: '2px solid #a0aec0' }}>{formatCurrency(parentTotals.loans)}</td>
                                        <td className="number-cell" style={{ borderTop: '2px solid #a0aec0' }}>{formatCurrency(parentTotals.gross)}</td>
                                        <td className="number-cell" style={{ borderTop: '2px solid #a0aec0' }}>{formatCurrency(parentTotals.net)}</td>
                                        <td style={{ borderTop: '2px solid #a0aec0' }}></td>
                                    </tr>
                                </optgroup>
                            )
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="grand-total-row avoid-break">
                            <td colSpan={2} style={{ textAlign: isRTL ? 'left' : 'right', borderTop: '3px double #718096' }}>
                                {t('report.grandTotal')}
                            </td>
                            <td className="number-cell" style={{ borderTop: '3px double #718096' }}>{formatCurrency(grandTotals.additions)}</td>
                            <td className="number-cell" style={{ borderTop: '3px double #718096' }}>{formatCurrency(grandTotals.deductions)}</td>
                            <td className="number-cell" style={{ borderTop: '3px double #718096' }}>{formatCurrency(grandTotals.loans)}</td>
                            <td className="number-cell" style={{ borderTop: '3px double #718096' }}>{formatCurrency(grandTotals.gross)}</td>
                            <td className="number-cell" style={{ borderTop: '3px double #718096' }}>{formatCurrency(grandTotals.net)}</td>
                            <td style={{ borderTop: '3px double #718096' }}></td>
                        </tr>
                    </tfoot>
                </table>
            </Box>
        )
    }
)

PayrollReportPrintTemplate.displayName = "PayrollReportPrintTemplate"
