import { Employee, Transaction, PayrollRun, PayrollSlip } from '@/types'
import { DateTime } from 'luxon'
import { pb } from '@/lib/pocketbase'

export const payrollService = {
  calculateSlip: (employee: Employee, transactions: Transaction[]): Omit<PayrollSlip, 'id' | 'collectionId' | 'collectionName' | 'created' | 'updated'> => {
    const hourlyRate = employee.monthlySalary / employee.workHours
    const dailyRate = employee.monthlySalary / 30 // Standard 30 days calculation

    const calculateAmount = (t: Transaction) => {
      if (t.unit === 'cash') return t.amount
      if (t.unit === 'hours') return t.amount * hourlyRate
      if (t.unit === 'days') return t.amount * dailyRate
      return 0
    }

    const additions = transactions
      .filter(t => t.type === 'addition')
      .reduce((sum, t) => sum + calculateAmount(t), 0)

    const deductions = transactions
      .filter(t => t.type === 'deduction')
      .reduce((sum, t) => sum + calculateAmount(t), 0)

    return {
      payrollRunId: '',
      employeeId: employee.id,
      departmentId: employee.department,
      basicSalary: employee.monthlySalary,
      hourlyRate,
      additions,
      deductions,
      netSalary: employee.monthlySalary + additions - deductions,
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
      const slipStats = payrollService.calculateSlip(emp, empTx)

      batch.collection('payroll_slips').create({
        payrollRunId: run.id,
        employeeId: emp.id,
        departmentId: emp.department,
        basicSalary: slipStats.basicSalary,
        hourlyRate: slipStats.hourlyRate,
        additions: slipStats.additions,
        deductions: slipStats.deductions,
        netSalary: slipStats.netSalary,
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
    const slips = await pb.collection('payroll_slips').getFullList({ sort: '-created' })

    return runs.map(run => {
      const runSlips = slips.filter(s => s.payrollRunId === run.id) as any
      return {
        ...run,
        slips: runSlips
      } as PayrollRun
    })
  }
}

