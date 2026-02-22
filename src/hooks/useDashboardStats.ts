import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { employeeService } from '@/services/employee.service'
import { transactionService } from '@/services/transaction.service'
import { payrollService } from '@/services/payroll.service'
import type { Employee, Transaction } from '@/types'

export const useDashboardStats = () => {
    const { data: employees = [], isLoading: empLoading } = useQuery({
        queryKey: ['employees'],
        queryFn: employeeService.getAll,
        select: (data) => data as unknown as Employee[]
    })

    const { data: transactions = [], isLoading: txLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => transactionService.getAll()
    })

    // `data` is:
    //  • undefined  → query still loading
    //  • null       → query resolved, no closed run exists
    //  • object     → query resolved, last closed run found
    const { data: lastClosed, isLoading: histLoading } = useQuery({
        queryKey: ['lastClosedPayroll'],
        queryFn: payrollService.getLastClosedRunTotal,
        // Do NOT aggressively cache — when a month is closed the value must refresh immediately
        staleTime: 0
    })

    const activeEmployees = useMemo(
        () => employees.filter(e => !e.isArchived),
        [employees]
    )

    const currentNetTotal = useMemo(() => {
        return activeEmployees.reduce((sum, emp) => {
            const empTx = transactions.filter((t: Transaction) => t.employeeId === emp.id)
            const slip = payrollService.calculateSlip(emp, empTx)
            return sum + slip.netSalary
        }, 0)
    }, [activeEmployees, transactions])

    const percentChange = useMemo(() => {
        // Still loading — don't resolve yet
        if (histLoading) return undefined
        // Confirmed no previous closed run exists
        if (!lastClosed || lastClosed.total === 0) return null
        return ((currentNetTotal - lastClosed.total) / lastClosed.total) * 100
    }, [currentNetTotal, lastClosed, histLoading])

    // --- Deduction Rate ---
    // currentDeductionTotal: sum of all open-month deduction + advance transactions (cash equivalent)
    const currentDeductionTotal = useMemo(() => {
        return activeEmployees.reduce((sum, emp) => {
            const empTx = transactions.filter((t: Transaction) => t.employeeId === emp.id)
            const slip = payrollService.calculateSlip(emp, empTx)
            return sum + slip.deductionAmount + slip.advanceAmount
        }, 0)
    }, [activeEmployees, transactions])

    // currentGross: sum of base salaries — the stable denominator
    const currentGross = useMemo(
        () => activeEmployees.reduce((sum, emp) => sum + emp.monthlySalary, 0),
        [activeEmployees]
    )

    // currentDeductionRate: percentage of gross payroll lost to deductions/advances
    const currentDeductionRate = useMemo(
        () => (currentGross > 0 ? (currentDeductionTotal / currentGross) * 100 : 0),
        [currentDeductionTotal, currentGross]
    )

    // deductionRateChange: percentage-POINT delta vs. last closed run
    //  • undefined → still loading
    //  • null      → no historical data available
    //  • number    → delta in percentage points (e.g. +1.5 means rate went up 1.5pp)
    const deductionRateChange = useMemo(() => {
        if (histLoading) return undefined
        if (!lastClosed || lastClosed.grossTotal === 0) return null
        const historicRate = (lastClosed.deductionTotal / lastClosed.grossTotal) * 100
        return currentDeductionRate - historicRate
    }, [currentDeductionRate, lastClosed, histLoading])

    return {
        currentNetTotal,
        lastNetTotal: lastClosed?.total ?? null,
        lastPeriod: lastClosed?.period ?? null,
        // undefined = loading, null = no previous run, number = actual delta
        percentChange,
        activeCount: activeEmployees.length,
        currentDeductionRate,
        deductionRateChange,
        isLoading: empLoading || txLoading || histLoading
    }
}
