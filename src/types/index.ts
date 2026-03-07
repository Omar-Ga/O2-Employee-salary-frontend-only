export type EmployeeScores = {
  performance: number
  dedication: number
  responsibility: number
}

// Hardcoded Type Replacements for what used to come from pocketbase-types
export type BaseSystemFields<T = unknown> = {
  id: string
  created: string
  updated: string
  collectionId: string
  collectionName: string
} & T

export type EmployeesResponse<Tscores = unknown, Texpand = unknown> = {
  id: string
  name: string
  email: string
  phone: string
  department: string // Department ID
  jobTitle: string
  monthlySalary: number
  nationalId: string
  workHours: number
  grade?: string
  isArchived?: boolean
  archiveDate?: string
  scores?: null | Tscores
} & BaseSystemFields<Texpand>

export type DepartmentsResponse<Texpand = unknown> = {
  id: string
  name: string
  type: string
  parentId?: string
} & BaseSystemFields<Texpand>

export type TransactionsResponse<Texpand = unknown> = {
  id: string
  amount: number
  category: 'overtime' | 'deduction' | 'bonus' | 'advance'
  date: string
  employeeId: string
  type: 'addition' | 'deduction'
  unit: 'hours' | 'days' | 'cash'
  reason?: string
  isClosed?: boolean
} & BaseSystemFields<Texpand>

export type PayrollRunsResponse<Texpand = unknown> = {
  id: string
  period: string
  date: string
  isClosed?: boolean
  totalBasic?: number
  totalNet?: number
  employeeCount?: number
} & BaseSystemFields<Texpand>

export type PayrollSlipsResponse<Texpand = unknown> = {
  id: string
  payrollRunId: string
  employeeId: string
  departmentId: string
  basicSalary?: number
  overtimeAmount?: number
  bonusAmount?: number
  deductionAmount?: number
  advanceAmount?: number
  netSalary?: number
  transactions?: string[]
} & BaseSystemFields<Texpand>

export type UsersResponse<Texpand = unknown> = {
  id: string
  email: string
  emailVisibility?: boolean
  username?: string
  verified?: boolean
  name?: string
  avatar?: string
  role?: string
  tokenKey: string
  password?: string
} & BaseSystemFields<Texpand>

export type UsersRecord = UsersResponse

export type Employee = EmployeesResponse<EmployeeScores>

export type Department = DepartmentsResponse

export type Transaction = TransactionsResponse

export type TransactionType = Transaction['type']
export type TransactionCategory = Transaction['category']

export type PayrollRun = Omit<PayrollRunsResponse, 'slips'> & {
  slips?: PayrollSlip[]
}

export type PayrollSlip = Omit<PayrollSlipsResponse, 'transactions'> & {
  transactions: Transaction[]
  employeeName?: string // Optional helper from frontend
  employeeJobTitle?: string // Optional helper from frontend
}

