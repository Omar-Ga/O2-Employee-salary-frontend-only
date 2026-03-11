import { Employee, SupabaseEmployee } from '@/types'
import { supabase } from '@/lib/supabase'

export interface ListResult<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

const mapEmployee = (data: SupabaseEmployee): Employee => ({
  id: data.id,
  name: data.name,
  email: data.email,
  phone: data.phone,
  department: data.department,
  jobTitle: data.job_title,
  monthlySalary: data.monthly_salary,
  nationalId: data.national_id,
  workHours: data.work_hours,
  grade: data.grade,
  isArchived: data.is_archived,
  archiveDate: data.archive_date,
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

export const employeeService = {
  getAll: async (page = 1, perPage = 50): Promise<ListResult<Employee>> => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / perPage);

    return {
      page,
      perPage,
      totalItems,
      totalPages,
      items: (data || []).map(mapEmployee)
    };
  },

  getActive: async (page = 1, perPage = 50): Promise<ListResult<Employee>> => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / perPage);

    return {
      page,
      perPage,
      totalItems,
      totalPages,
      items: (data || []).map(mapEmployee)
    };
  },

  getAllActive: async (): Promise<Employee[]> => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapEmployee);
  },

  create: async (data: Partial<Employee>): Promise<Employee> => {
    // Map camelCase to snake_case for Supabase insertion
    const insertData = {
      name: data.name!,
      email: data.email || null,
      phone: data.phone!,
      department: data.department!,
      job_title: data.jobTitle!,
      monthly_salary: data.monthlySalary!,
      national_id: data.nationalId!,
      work_hours: data.workHours!,
      grade: data.grade || null,
      scores: data.scores as any || null,
    };

    const { data: createdEmployee, error } = await supabase
      .from('employees')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return mapEmployee(createdEmployee);
  },

  update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.jobTitle !== undefined) updateData.job_title = data.jobTitle;
    if (data.monthlySalary !== undefined) updateData.monthly_salary = data.monthlySalary;
    if (data.nationalId !== undefined) updateData.national_id = data.nationalId;
    if (data.workHours !== undefined) updateData.work_hours = data.workHours;
    if (data.grade !== undefined) updateData.grade = data.grade;

    const { data: updatedEmployee, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapEmployee(updatedEmployee);
  },

  softDelete: async (id: string): Promise<Employee> => {
    const { data: archivedEmployee, error } = await supabase
      .from('employees')
      .update({ is_archived: true, archive_date: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapEmployee(archivedEmployee);
  },

  restore: async (id: string): Promise<Employee> => {
    const { data: restoredEmployee, error } = await supabase
      .from('employees')
      .update({ is_archived: false, archive_date: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapEmployee(restoredEmployee);
  }
}
