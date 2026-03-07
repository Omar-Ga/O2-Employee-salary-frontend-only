import { Employee, Transaction, PayrollRun, PayrollSlip } from '@/types'

// Mock ListResult
interface ListResult<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

export interface PayrollStats {
  activeCount: number
  currentNetTotal: number
  currentDeductionTotal: number
  currentGross: number
  currentDeductionRate: number
  lastRunTotal: number
  lastPeriod: string | null
  percentChange: number | null
  deductionRateChange: number | null
}

const emptyList = {
  page: 1,
  perPage: 50,
  totalItems: 0,
  totalPages: 0,
  items: []
}

/** Converts a raw transaction amount to its cash equivalent */
const toCash = (t: Transaction, employee: Employee): number => {
  const hourlyRate = (employee.monthlySalary || 0) / (employee.workHours || 1)
  const dailyRate = (employee.monthlySalary || 0) / 30
  if (t.unit === 'cash') return t.amount
  if (t.unit === 'hours') return t.amount * hourlyRate
  if (t.unit === 'days') return t.amount * dailyRate
  return 0
}

export const payrollService = {
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
      netSalary: (employee.monthlySalary || 0) + totalAdditions - totalDeductions,
      transactions
    }
  },

  closeMonth: async (_period: string) => {
    return Promise.resolve({ success: true, runId: 'dummy-run-id' })
  },

  getRuns: async (_page = 1, _perPage = 10): Promise<ListResult<PayrollRun>> => {
    return Promise.resolve(emptyList)
  },

  getRunSlips: async (_runId: string): Promise<PayrollSlip[]> => {
    return Promise.resolve([])
  },

  getLastClosedRunTotal: async (): Promise<{
    total: number
    period: string
    deductionTotal: number
    grossTotal: number
  } | null> => {
    return Promise.resolve(null)
  },

  getStats: async (): Promise<PayrollStats> => {
    return Promise.resolve({
      activeCount: 0,
      currentNetTotal: 0,
      currentDeductionTotal: 0,
      currentGross: 0,
      currentDeductionRate: 0,
      lastRunTotal: 0,
      lastPeriod: null,
      percentChange: null,
      deductionRateChange: null
    })
  },

  revertRun: async (_runId: string): Promise<void> => {
    return Promise.resolve()
  },

  deleteRun: async (_runId: string): Promise<void> => {
    return Promise.resolve()
  },
}
