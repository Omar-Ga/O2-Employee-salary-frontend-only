import {
  EmployeesResponse,
  DepartmentsResponse,
  TransactionsResponse,
  PayrollRunsResponse,
  PayrollSlipsResponse,
  UsersResponse,
  UsersRecord,
} from './pocketbase-types'

export type EmployeeScores = {
  performance: number
  dedication: number
  responsibility: number
}

export type {
  EmployeesResponse,
  DepartmentsResponse,
  TransactionsResponse,
  PayrollRunsResponse,
  PayrollSlipsResponse,
  UsersResponse,
  UsersRecord,
}

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

