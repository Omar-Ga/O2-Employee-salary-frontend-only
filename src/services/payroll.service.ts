import { Employee, Transaction, PayrollRun, PayrollSlip } from '@/types'
import { DateTime } from 'luxon'
import { pb } from '@/lib/pocketbase'

/** Converts a raw transaction amount to its cash equivalent */
const toCash = (t: Transaction, employee: Employee): number => {
  const hourlyRate = employee.monthlySalary / employee.workHours
  const dailyRate = employee.monthlySalary / 30
  if (t.unit === 'cash') return t.amount
  if (t.unit === 'hours') return t.amount * hourlyRate
  if (t.unit === 'days') return t.amount * dailyRate
  return 0
}

export const payrollService = {
  /**
   * Calculates a live slip preview (before closing the month).
   * Returns granular category totals derived from raw transactions.
   */
  calculateSlip: (
    employee: Employee,
    transactions: Transaction[]
  ): Omit<PayrollSlip, 'id' | 'collectionId' | 'collectionName' | 'created' | 'updated'> => {
    const overtimeAmount = transactions
      .filter(t => t.category === 'overtime')
      .reduce((sum, t) => sum + toCash(t, employee), 0)

    const bonusAmount = transactions
      .filter(t => t.category === 'bonus')
      .reduce((sum, t) => sum + toCash(t, employee), 0)

    const deductionAmount = transactions
      .filter(t => t.category === 'deduction')
      .reduce((sum, t) => sum + toCash(t, employee), 0)

    const advanceAmount = transactions
      .filter(t => t.category === 'advance')
      .reduce((sum, t) => sum + toCash(t, employee), 0)

    const totalAdditions = overtimeAmount + bonusAmount
    const totalDeductions = deductionAmount + advanceAmount

    return {
      payrollRunId: '',
      employeeId: employee.id,
      departmentId: employee.department,
      basicSalary: employee.monthlySalary,
      overtimeAmount,
      bonusAmount,
      deductionAmount,
      advanceAmount,
      netSalary: employee.monthlySalary + totalAdditions - totalDeductions,
      transactions: transactions as any
    }
  },

  closeMonth: async (employees: Employee[], transactions: Transaction[]) => {
    const currentMonth = DateTime.now().toFormat('yyyy-MM')

    const run = await pb.collection('payroll_runs').create({
      period: currentMonth,
      date: DateTime.now().toISO()!,
      isClosed: true
    })

    const batch = pb.createBatch()

    employees.forEach(emp => {
      const empTx = transactions.filter(t => t.employeeId === emp.id)
      const slip = payrollService.calculateSlip(emp, empTx)

      batch.collection('payroll_slips').create({
        payrollRunId: run.id,
        employeeId: emp.id,
        departmentId: emp.department,
        basicSalary: slip.basicSalary,
        overtimeAmount: slip.overtimeAmount,
        bonusAmount: slip.bonusAmount,
        deductionAmount: slip.deductionAmount,
        advanceAmount: slip.advanceAmount,
        netSalary: slip.netSalary,
        transactions: empTx.map(t => t.id)
      })
    })

    transactions.forEach(tx => {
      batch.collection('transactions').update(tx.id, { isClosed: true })
    })

    await batch.send()

    return run
  },

  getHistory: async (): Promise<PayrollRun[]> => {
    const runs = await pb.collection('payroll_runs').getFullList({ sort: '-created' })
    const slips = await pb.collection('payroll_slips').getFullList({
      sort: '-created',
      expand: 'employeeId,transactions'
    })

    return runs.map(run => {
      const runSlips = slips.filter(s => s.payrollRunId === run.id) as any
      return {
        ...run,
        slips: runSlips
      } as PayrollRun
    })
  },

  /** Returns the total net payout of the most recent closed payroll run, or null if none exist. */
  getLastClosedRunTotal: async (): Promise<{ total: number; period: string } | null> => {
    try {
      const lastRun = await pb.collection('payroll_runs').getFirstListItem(
        "isClosed = true",
        { sort: '-created' }
      )

      const slips = await pb.collection('payroll_slips').getFullList({
        filter: `payrollRunId = "${lastRun.id}"`,
      })

      const total = slips.reduce((sum, s: any) => sum + (s.netSalary || 0), 0)
      return { total, period: lastRun.period as string }
    } catch {
      // No closed run found
      return null
    }
  }
}
