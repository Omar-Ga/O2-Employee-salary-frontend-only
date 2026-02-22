/**
* Manual fallback for pocketbase-types.ts which is failing to generate fields.
* Based on schema in pb/pb_migrations/*.js
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
    Departments = "departments",
    Employees = "employees",
    PayrollRuns = "payroll_runs",
    PayrollSlips = "payroll_slips",
    Transactions = "transactions",
    Users = "users",
}

export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

export type BaseSystemFields<T = unknown> = {
    id: RecordIdString
    created: IsoDateString
    updated: IsoDateString
    collectionId: string
    collectionName: Collections
    expand?: T
}

export type DepartmentsRecord = {
    name: string
    parentId?: string
    type: 'structural' | 'functional'
}

export type EmployeesRecord = {
    name: string
    email: string
    nationalId: string
    phone: string
    jobTitle: string
    department: string
    monthlySalary: number
    workHours: number
    isArchived: boolean
    grade?: 'Excellent' | 'Good' | 'Bad'
    scores?: any // JSON
}

export type TransactionsRecord = {
    employeeId: string
    date: string
    isClosed: boolean
    category: 'overtime' | 'deduction' | 'bonus' | 'advance'
    type: 'addition' | 'deduction'
    unit: 'hours' | 'days' | 'cash'
    amount: number
    reason?: string
}

export type PayrollRunsRecord = {
    period: string
    date: string
    isClosed: boolean
}

export type PayrollSlipsRecord = {
    payrollRunId: string
    employeeId: string
    departmentId: string
    basicSalary: number
    overtimeAmount: number
    bonusAmount: number
    deductionAmount: number
    advanceAmount: number
    netSalary: number
    transactions: string[] // multiple relation
}

export type UsersRecord = {
    name: string
    avatar?: string
    email: string
    emailVisibility: boolean
    verified: boolean
    role: 'admin' | 'editor' | 'viewer'
}

export type DepartmentsResponse<Texpand = unknown> = Required<DepartmentsRecord> & BaseSystemFields<Texpand>
export type EmployeesResponse<Texpand = unknown> = Required<EmployeesRecord> & BaseSystemFields<Texpand>
export type TransactionsResponse<Texpand = unknown> = Required<TransactionsRecord> & BaseSystemFields<Texpand>
export type PayrollRunsResponse<Texpand = unknown> = Required<PayrollRunsRecord> & BaseSystemFields<Texpand>
export type PayrollSlipsResponse<Texpand = unknown> = Required<PayrollSlipsRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & BaseSystemFields<Texpand>

export type CollectionResponses = {
    departments: DepartmentsResponse
    employees: EmployeesResponse
    payroll_runs: PayrollRunsResponse
    payroll_slips: PayrollSlipsResponse
    transactions: TransactionsResponse
    users: UsersResponse
}

export type TypedPocketBase = PocketBase & {
    collection<T extends keyof CollectionResponses>(idOrName: T): RecordService<CollectionResponses[T]>
}
