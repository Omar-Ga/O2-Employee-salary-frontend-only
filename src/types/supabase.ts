export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            departments: {
                Row: {
                    id: string
                    name: string
                    type: 'structural' | 'functional'
                    parent_id: string | null
                    color_palette: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    type: 'structural' | 'functional'
                    parent_id?: string | null
                    color_palette?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    type?: 'structural' | 'functional'
                    parent_id?: string | null
                    color_palette?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "departments_parent_id_fkey"
                        columns: ["parent_id"]
                        isOneToOne: false
                        referencedRelation: "departments"
                        referencedColumns: ["id"]
                    }
                ]
            }
            employees: {
                Row: {
                    id: string
                    name: string
                    email: string
                    phone: string
                    department: string
                    job_title: string
                    monthly_salary: number
                    national_id: string
                    work_hours: number
                    grade: string | null
                    scores: Json | null
                    is_archived: boolean
                    archive_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email: string
                    phone: string
                    department: string
                    job_title: string
                    monthly_salary: number
                    national_id: string
                    work_hours: number
                    grade?: string | null
                    scores?: Json | null
                    is_archived?: boolean
                    archive_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string
                    phone?: string
                    department?: string
                    job_title?: string
                    monthly_salary?: number
                    national_id?: string
                    work_hours?: number
                    grade?: string | null
                    scores?: Json | null
                    is_archived?: boolean
                    archive_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            transactions: {
                Row: {
                    id: string
                    amount: number
                    category: string
                    date: string
                    employee_id: string
                    type: 'addition' | 'deduction'
                    unit: string
                    reason: string | null
                    is_closed: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    amount: number
                    category: string
                    date: string
                    employee_id: string
                    type: 'addition' | 'deduction'
                    unit: string
                    reason?: string | null
                    is_closed?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    amount?: number
                    category?: string
                    date?: string
                    employee_id?: string
                    type?: 'addition' | 'deduction'
                    unit?: string
                    reason?: string | null
                    is_closed?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            payroll_runs: {
                Row: {
                    id: string
                    period: string
                    date: string
                    total_basic: number | null
                    total_net: number | null
                    employee_count: number | null
                    total_deductions: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    period: string
                    date: string
                    total_basic?: number | null
                    total_net?: number | null
                    employee_count?: number | null
                    total_deductions?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    period?: string
                    date?: string
                    total_basic?: number | null
                    total_net?: number | null
                    employee_count?: number | null
                    total_deductions?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            payroll_slips: {
                Row: {
                    id: string
                    payroll_run_id: string
                    employee_id: string
                    department_id: string
                    basic_salary: number | null
                    overtime_amount: number | null
                    bonus_amount: number | null
                    deduction_amount: number | null
                    advance_amount: number | null
                    net_salary: number | null
                    transactions: any | null
                    employee_name: string
                    employee_job_title: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    payroll_run_id: string
                    employee_id: string
                    department_id: string
                    basic_salary?: number | null
                    overtime_amount?: number | null
                    bonus_amount?: number | null
                    deduction_amount?: number | null
                    advance_amount?: number | null
                    net_salary?: number | null
                    transactions?: any | null
                    employee_name: string
                    employee_job_title: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    payroll_run_id?: string
                    employee_id?: string
                    department_id?: string
                    basic_salary?: number | null
                    overtime_amount?: number | null
                    bonus_amount?: number | null
                    deduction_amount?: number | null
                    advance_amount?: number | null
                    net_salary?: number | null
                    transactions?: any | null
                    employee_name?: string
                    employee_job_title?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
