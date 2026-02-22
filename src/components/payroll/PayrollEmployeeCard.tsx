import { Box, Grid, Text, Button } from "@chakra-ui/react"
import { formatCurrency } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface PayrollEmployeeCardProps {
    name: string
    jobTitle: string
    basicSalary: number
    additions: number
    deductions: number
    netSalary: number
    onManage?: () => void
    isHistorical?: boolean
}

export const PayrollEmployeeCard = ({
    name,
    jobTitle,
    basicSalary,
    additions,
    deductions,
    netSalary,
    onManage,
    isHistorical = false
}: PayrollEmployeeCardProps) => {
    const { t } = useTranslation('payroll')

    const columns = isHistorical
        ? { base: "1fr", md: "2fr 1fr 1fr 1fr 1fr" }
        : { base: "1fr", md: "2fr 1fr 1fr 1fr 1fr 100px" }

    return (
        <Box
            bg="oxygen.50"
            p="3"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="oxygen.100"
            _hover={{ bg: "oxygen.100", shadow: "sm", borderColor: "oxygen.300" }}
            transition="all 0.2s"
        >
            <Grid templateColumns={columns} gap="4" alignItems="center">
                <Box>
                    <Text fontWeight="bold" fontSize="sm">{name}</Text>
                    <Text fontSize="xs" color="gray.500">{jobTitle}</Text>
                </Box>

                <Box textAlign="end">
                    <Text fontSize="xs" color="gray.500" display={{ md: 'none' }}>{t('run.table.basic')}</Text>
                    <Text fontSize="sm">{formatCurrency(basicSalary)}</Text>
                </Box>

                <Box textAlign="end">
                    <Text fontSize="xs" color="gray.500" display={{ md: 'none' }}>{t('run.table.additions')}</Text>
                    <Text fontSize="sm" color="green.600">+{formatCurrency(additions)}</Text>
                </Box>

                <Box textAlign="end">
                    <Text fontSize="xs" color="gray.500" display={{ md: 'none' }}>{t('run.table.deductions')}</Text>
                    <Text fontSize="sm" color="red.600">-{formatCurrency(deductions)}</Text>
                </Box>

                <Box textAlign="end">
                    <Text fontSize="xs" color="gray.500" display={{ md: 'none' }}>{t('run.table.netSalary')}</Text>
                    <Text fontSize="sm" fontWeight="bold">{formatCurrency(netSalary)}</Text>
                </Box>

                {!isHistorical && onManage && (
                    <Box textAlign="end">
                        <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); onManage(); }}>
                            {t('run.table.manage')}
                        </Button>
                    </Box>
                )}
            </Grid>
        </Box>
    )
}
