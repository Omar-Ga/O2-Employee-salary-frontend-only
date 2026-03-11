import { Transaction, SupabaseTransaction } from "@/types"
import { supabase } from "@/lib/supabase"

export interface ListResult<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

const mapTransaction = (data: SupabaseTransaction): Transaction => ({
  id: data.id,
  amount: data.amount,
  category: data.category,
  date: data.date,
  employeeId: data.employee_id,
  type: data.type,
  unit: data.unit,
  reason: data.reason || undefined,
  isClosed: data.is_closed || false,
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

export const transactionService = {
  getAll: async (page = 1, perPage = 50, employeeId?: string): Promise<ListResult<Transaction>> => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(from, to);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / perPage);

    return {
      page,
      perPage,
      totalItems,
      totalPages,
      items: (data || []).map(mapTransaction)
    };
  },

  getOpen: async (page = 1, perPage = 50): Promise<ListResult<Transaction>> => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('is_closed', false)
      .order('date', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / perPage);

    return {
      page,
      perPage,
      totalItems,
      totalPages,
      items: (data || []).map(mapTransaction)
    };
  },

  getForEmployees: async (employeeIds: string[]): Promise<Transaction[]> => {
    if (!employeeIds.length) return [];
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .in('employee_id', employeeIds)
      .eq('is_closed', false)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapTransaction);
  },

  create: async (data: Partial<Transaction>): Promise<Transaction> => {
    const insertData = {
      amount: data.amount!,
      category: data.category!,
      date: data.date!,
      employee_id: data.employeeId!,
      type: data.type!,
      unit: data.unit!,
      reason: data.reason || null,
      is_closed: data.isClosed || false,
    };

    const { data: createdTransaction, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return mapTransaction(createdTransaction);
  },

  createBulk: async (data: Partial<Transaction>[]): Promise<Transaction[]> => {
    if (!data.length) return [];

    const insertData = data.map(tx => ({
      amount: tx.amount!,
      category: tx.category!,
      date: tx.date!,
      employee_id: tx.employeeId!,
      type: tx.type!,
      unit: tx.unit!,
      reason: tx.reason || null,
      is_closed: tx.isClosed || false,
    }));

    const { data: createdTransactions, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select();

    if (error) throw error;
    return (createdTransactions || []).map(mapTransaction);
  },

  delete: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
