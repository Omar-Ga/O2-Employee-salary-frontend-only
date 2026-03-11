import { Employee, Transaction, PayrollRun, PayrollSlip } from '@/types'
import { supabase } from '@/lib/supabase'
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



import { WORKING_DAYS_PER_MONTH } from '@/lib/constants'

/** Converts a raw transaction amount to its cash equivalent */
const toCash = (t: Transaction, employee: Employee): number => {
  const hourlyRate = (employee.monthlySalary || 0) / (employee.workHours || 1)
  const dailyRate = (employee.monthlySalary || 0) / WORKING_DAYS_PER_MONTH
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
      employeeName: employee.name,
      employeeJobTitle: employee.jobTitle,
      departmentId: employee.department,
      basicSalary: employee.monthlySalary,
      overtimeAmount,
      bonusAmount,
      deductionAmount,
      advanceAmount,
      netSalary: (employee.monthlySalary || 0) + totalAdditions - totalDeductions,
      transactions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  closeMonth: async (period: string) => {
    const { data: runId, error } = await supabase.rpc('close_payroll_run', {
      p_period: period,
    })

    if (error) {
      console.error('Error closing month:', error)
      throw new Error(error.message || 'Failed to close month')
    }

    return { success: true, runId }
  },

  getRuns: async (page = 1, perPage = 10): Promise<ListResult<PayrollRun>> => {
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await supabase
      .from('payroll_runs')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching runs:', error)
      throw error
    }

    return {
      page,
      perPage,
      totalItems: count || 0,
      totalPages: count ? Math.ceil(count / perPage) : 0,
      items: (data || []).map((run) => ({
        id: run.id,
        period: run.period,
        date: run.date,
        totalBasic: run.total_basic,
        totalNet: run.total_net,
        employeeCount: run.employee_count,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
      })) as PayrollRun[],
    }
  },

  getRunSlips: async (runId: string): Promise<PayrollSlip[]> => {
    const { data, error } = await supabase
      .from('payroll_slips')
      .select('*')
      .eq('payroll_run_id', runId)

    if (error) {
      console.error('Error fetching run slips:', error)
      throw error
    }

    return (data || []).map((slip) => ({
      id: slip.id,
      payrollRunId: slip.payroll_run_id,
      employeeId: slip.employee_id,
      employeeName: slip.employee_name,
      employeeJobTitle: slip.employee_job_title,
      departmentId: slip.department_id,
      basicSalary: slip.basic_salary,
      overtimeAmount: slip.overtime_amount,
      bonusAmount: slip.bonus_amount,
      deductionAmount: slip.deduction_amount,
      advanceAmount: slip.advance_amount,
      netSalary: slip.net_salary,
      createdAt: slip.created_at,
      updatedAt: slip.updated_at,
    })) as PayrollSlip[]
  },

  getLastClosedRunTotal: async (): Promise<{
    total: number
    period: string
    deductionTotal: number
    grossTotal: number
  } | null> => {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('total_net, total_basic, total_deductions, period')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching last run:', error)
      return null
    }

    if (!data) return null

    return {
      total: data.total_net || 0,
      period: data.period,
      grossTotal: data.total_basic || 0,
      deductionTotal: data.total_deductions || 0
    }
  },

  getStats: async (): Promise<PayrollStats> => {
    try {
      // 1. Fetch active employees
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('is_archived', false)

      if (empError) throw empError
      
      const employees = (employeesData || []).map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        department: emp.department,
        jobTitle: emp.job_title,
        monthlySalary: emp.monthly_salary,
        nationalId: emp.national_id,
        workHours: emp.work_hours,
        grade: emp.grade,
        isArchived: emp.is_archived,
        archiveDate: emp.archive_date,
        createdAt: emp.created_at,
        updatedAt: emp.updated_at
      } as Employee))

      // 2. Fetch open transactions for these employees
      const empIds = employees.map(e => e.id)
      let transactions: Transaction[] = []
      
      if (empIds.length > 0) {
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .in('employee_id', empIds)
          .eq('is_closed', false)
          
        if (txError) throw txError
        
        transactions = (txData || []).map(tx => ({
          id: tx.id,
          amount: tx.amount,
          category: tx.category,
          date: tx.date,
          employeeId: tx.employee_id,
          type: tx.type,
          unit: tx.unit,
          reason: tx.reason || undefined,
          isClosed: tx.is_closed || false,
          createdAt: tx.created_at,
          updatedAt: tx.updated_at
        } as Transaction))
      }

      // 3. Compute projections
      let currentNetTotal = 0
      let currentDeductionTotal = 0
      let currentGross = 0

      for (const emp of employees) {
        const empTransactions = transactions.filter(t => t.employeeId === emp.id)
        const slip = payrollService.calculateSlip(emp, empTransactions)
        currentNetTotal += slip.netSalary || 0
        currentDeductionTotal += (slip.deductionAmount || 0) + (slip.advanceAmount || 0)
        currentGross += (slip.basicSalary || 0) + (slip.overtimeAmount || 0) + (slip.bonusAmount || 0)
      }

      const currentDeductionRate = currentGross > 0 ? (currentDeductionTotal / currentGross) * 100 : 0

      // 4. Fetch last run
      const lastRun = await payrollService.getLastClosedRunTotal()
      
      let percentChange: number | null = null
      let deductionRateChange: number | null = null

      if (lastRun) {
        if (lastRun.total > 0) {
          percentChange = ((currentNetTotal - lastRun.total) / lastRun.total) * 100
        } else {
          percentChange = currentNetTotal > 0 ? 100 : 0
        }

        const lastDeductionRate = lastRun.grossTotal > 0 ? (lastRun.deductionTotal / lastRun.grossTotal) * 100 : 0
        deductionRateChange = currentDeductionRate - lastDeductionRate
      }

      return {
        activeCount: employees.length,
        currentNetTotal,
        currentDeductionTotal,
        currentGross,
        currentDeductionRate,
        lastRunTotal: lastRun?.total || 0,
        lastPeriod: lastRun?.period || null,
        percentChange,
        deductionRateChange
      }
    } catch (error) {
      console.error('Error computing payroll stats:', error)
      throw error
    }
  },

  revertRun: async (runId: string): Promise<void> => {
    const { error } = await supabase.rpc('revert_payroll_run', {
      p_run_id: runId,
    })

    if (error) {
      console.error('Error reverting payroll run:', error)
      throw new Error(error.message || 'Failed to revert payroll run')
    }
  },

  deleteRun: async (runId: string): Promise<void> => {
    const { error } = await supabase.rpc('delete_payroll_run', {
      p_run_id: runId,
    })

    if (error) {
      console.error('Error deleting payroll run:', error)
      throw new Error(error.message || 'Failed to delete payroll run')
    }
  },
}
