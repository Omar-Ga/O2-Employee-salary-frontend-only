import { nanoid } from 'nanoid'
import { Employee, Transaction, PayrollRun, PayrollSlip } from '@/types'
import { storage } from './storage'
import { DateTime } from 'luxon'

const TRANSACTIONS_KEY = 'oxygen_transactions'
const HISTORY_KEY = 'oxygen_payroll_history'

export const payrollService = {
  getTransactions: (employeeId?: string): Transaction[] => {
    const all = storage.get<Transaction[]>(TRANSACTIONS_KEY, [])
    if (employeeId) return all.filter(t => t.employeeId === employeeId && !t.isClosed)
    return all.filter(t => !t.isClosed)
  },

  addTransaction: (data: Omit<Transaction, 'id' | 'isClosed'>) => {
    const newTx = {
      ...data,
      id: nanoid(),
      isClosed: false
    } as Transaction
    
    const all = storage.get<Transaction[]>(TRANSACTIONS_KEY, [])
    storage.set(TRANSACTIONS_KEY, [...all, newTx])
    return newTx
  },

  addTransactions: (data: Omit<Transaction, 'id' | 'isClosed'>[]) => {
    const newTxs = data.map(d => ({
      ...d,
      id: nanoid(),
      isClosed: false
    } as Transaction))
    
    const all = storage.get<Transaction[]>(TRANSACTIONS_KEY, [])
    storage.set(TRANSACTIONS_KEY, [...all, ...newTxs])
    return newTxs
  },

  removeTransaction: (id: string) => {
    const all = storage.get<Transaction[]>(TRANSACTIONS_KEY, [])
    const filtered = all.filter(t => t.id !== id)
    storage.set(TRANSACTIONS_KEY, filtered)
  },

  calculateSlip: (employee: Employee, transactions: Transaction[]): PayrollSlip => {
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
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      basicSalary: employee.monthlySalary,
      hourlyRate,
      additions,
      deductions,
      netSalary: employee.monthlySalary + additions - deductions,
      transactions
    }
  },

  closeMonth: (employees: Employee[]) => {
    const currentMonth = DateTime.now().toFormat('yyyy-MM')
    const transactions = payrollService.getTransactions()
    
    const slips = employees.map(emp => {
      const empTx = transactions.filter(t => t.employeeId === emp.id)
      return payrollService.calculateSlip(emp, empTx)
    })

    const run: PayrollRun = {
      id: currentMonth,
      date: DateTime.now().toISO()!,
      isClosed: true,
      slips
    }

    // Save History
    const history = storage.get<PayrollRun[]>(HISTORY_KEY, [])
    storage.set(HISTORY_KEY, [...history, run])

    // Close Transactions
    const allTx = storage.get<Transaction[]>(TRANSACTIONS_KEY, [])
    const updatedTx = allTx.map(t => (!t.isClosed ? { ...t, isClosed: true } : t))
    storage.set(TRANSACTIONS_KEY, updatedTx)
    
    return run
  },

  getHistory: () => storage.get<PayrollRun[]>(HISTORY_KEY, [])
}
