export interface Employee {
  id: string
  name: string
  email: string
  nationalId: string
  phone: string
  jobTitle: string
  department: string // ID
  monthlySalary: number
  workHours: number
  isArchived: boolean
  grade?: 'Excellent' | 'Good' | 'Bad'
  scores?: {
    performance: number
    dedication: number
    responsibility: number
  }
}

export interface Department {
  id: string
  name: string
  parentId?: string
  type: 'structural' | 'functional'
}

export type TransactionType = 'addition' | 'deduction'

export type TransactionCategory = 'overtime' | 'deduction' | 'bonus' | 'advance'

// Base Transaction
interface BaseTransaction {
  id: string
  employeeId: string
  date: string
  isClosed: boolean
}

// 1. Overtime: Addition, Time-based
export interface OvertimeTransaction extends BaseTransaction {
  category: 'overtime'
  type: 'addition'
  unit: 'hours' | 'days'
  amount: number // e.g., 2 hours
}

// 2. Deduction: Deduction, Time-based (Absence/Lateness)
export interface DeductionTransaction extends BaseTransaction {
  category: 'deduction' // Covers Absence/Lateness
  type: 'deduction'
  unit: 'hours' | 'days'
  amount: number
  reason?: string // Optional: "Lateness", "Absence"
}

// 3. Bonus: Addition, Cash-based
export interface BonusTransaction extends BaseTransaction {
  category: 'bonus'
  type: 'addition'
  unit: 'cash'
  amount: number // e.g., 1000 EGP
}

// 4. Advance: Deduction, Cash-based
export interface AdvanceTransaction extends BaseTransaction {
  category: 'advance'
  type: 'deduction'
  unit: 'cash'
  amount: number
}

export type Transaction = OvertimeTransaction | DeductionTransaction | BonusTransaction | AdvanceTransaction

export interface PayrollRun {
  id: string // Month-Year e.g. "2023-10"
  date: string
  isClosed: boolean
  slips: PayrollSlip[]
}

export interface PayrollSlip {
  employeeId: string
  employeeName: string
  department: string
  basicSalary: number
  hourlyRate: number
  additions: number
  deductions: number
  netSalary: number
  transactions: Transaction[]
}
