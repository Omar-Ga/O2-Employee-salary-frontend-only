import { Database } from './supabase'

export type SupabaseEmployee = Database['public']['Tables']['employees']['Row']
export type SupabaseDepartment = Database['public']['Tables']['departments']['Row']
export type SupabaseTransaction = Database['public']['Tables']['transactions']['Row']
export type SupabasePayrollRun = Database['public']['Tables']['payroll_runs']['Row']
export type SupabasePayrollSlip = Database['public']['Tables']['payroll_slips']['Row']

export type EmployeeScores = {
  performance: number
  dedication: number
  responsibility: number
}

// App-level derived types (camelCase)
export type EmployeesResponse = {
  id: SupabaseEmployee['id']
  name: SupabaseEmployee['name']
  email: SupabaseEmployee['email']
  phone: SupabaseEmployee['phone']
  department: SupabaseEmployee['department']
  jobTitle: SupabaseEmployee['job_title']
  monthlySalary: SupabaseEmployee['monthly_salary']
  nationalId: SupabaseEmployee['national_id']
  workHours: SupabaseEmployee['work_hours']
  grade?: SupabaseEmployee['grade']
  isArchived?: SupabaseEmployee['is_archived']
  archiveDate?: SupabaseEmployee['archive_date']
  scores?: EmployeeScores | null
  createdAt: SupabaseEmployee['created_at']
  updatedAt: SupabaseEmployee['updated_at']
}

export type DepartmentsResponse = {
  id: SupabaseDepartment['id']
  name: SupabaseDepartment['name']
  type: SupabaseDepartment['type']
  parentId?: SupabaseDepartment['parent_id']
  colorPalette?: SupabaseDepartment['color_palette']
  createdAt: SupabaseDepartment['created_at']
  updatedAt: SupabaseDepartment['updated_at']
}

export type TransactionsResponse = {
  id: SupabaseTransaction['id']
  amount: SupabaseTransaction['amount']
  category: SupabaseTransaction['category']
  date: SupabaseTransaction['date']
  employeeId: SupabaseTransaction['employee_id']
  type: SupabaseTransaction['type']
  unit: SupabaseTransaction['unit']
  reason?: SupabaseTransaction['reason']
  isClosed?: SupabaseTransaction['is_closed']
  createdAt: SupabaseTransaction['created_at']
  updatedAt: SupabaseTransaction['updated_at']
}

export type PayrollRunsResponse = {
  id: SupabasePayrollRun['id']
  period: SupabasePayrollRun['period']
  date: SupabasePayrollRun['date']
  totalBasic?: SupabasePayrollRun['total_basic']
  totalNet?: SupabasePayrollRun['total_net']
  employeeCount?: SupabasePayrollRun['employee_count']
  totalDeductions?: SupabasePayrollRun['total_deductions']
  createdAt: SupabasePayrollRun['created_at']
  updatedAt: SupabasePayrollRun['updated_at']
}

export type PayrollSlipsResponse = {
  id: SupabasePayrollSlip['id']
  payrollRunId: SupabasePayrollSlip['payroll_run_id']
  employeeId: SupabasePayrollSlip['employee_id']
  departmentId: SupabasePayrollSlip['department_id']
  basicSalary?: SupabasePayrollSlip['basic_salary']
  overtimeAmount?: SupabasePayrollSlip['overtime_amount']
  bonusAmount?: SupabasePayrollSlip['bonus_amount']
  deductionAmount?: SupabasePayrollSlip['deduction_amount']
  advanceAmount?: SupabasePayrollSlip['advance_amount']
  netSalary?: SupabasePayrollSlip['net_salary']
  transactions?: SupabasePayrollSlip['transactions']
  employeeName: SupabasePayrollSlip['employee_name']
  employeeJobTitle: SupabasePayrollSlip['employee_job_title']
  createdAt: SupabasePayrollSlip['created_at']
  updatedAt: SupabasePayrollSlip['updated_at']
}

export type UsersResponse = {
  id: string
  email: string
  name?: string
  role?: string
}
export type UsersRecord = UsersResponse

export type Employee = EmployeesResponse
export type Department = DepartmentsResponse
export type Transaction = TransactionsResponse

export type TransactionType = SupabaseTransaction['type']
export type TransactionCategory = SupabaseTransaction['category']

export type PayrollRun = Omit<PayrollRunsResponse, 'slips'> & {
  slips?: PayrollSlip[]
}

export type PayrollSlip = Omit<PayrollSlipsResponse, 'transactions'> & {
  transactions: Transaction[]
}
