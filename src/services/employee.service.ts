import { Employee } from '@/types'

// Mock ListResult since we removed pocketbase package
interface ListResult<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

const emptyList = {
  page: 1,
  perPage: 50,
  totalItems: 0,
  totalPages: 0,
  items: []
}

export const employeeService = {
  getAll: async (_page = 1, _perPage = 50): Promise<ListResult<Employee>> => {
    return Promise.resolve(emptyList)
  },

  getActive: async (_page = 1, _perPage = 50): Promise<ListResult<Employee>> => {
    return Promise.resolve(emptyList)
  },

  getAllActive: async (): Promise<Employee[]> => {
    return Promise.resolve([])
  },

  create: async (data: Partial<Employee>): Promise<Employee> => {
    return Promise.resolve({ id: 'dummy-id', ...data } as Employee)
  },

  update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    return Promise.resolve({ id, ...data } as Employee)
  },

  softDelete: async (id: string): Promise<Employee> => {
    return Promise.resolve({ id, isArchived: true, archiveDate: new Date().toISOString() } as Employee)
  },

  restore: async (id: string): Promise<Employee> => {
    return Promise.resolve({ id, isArchived: false, archiveDate: "" } as Employee)
  }
}
