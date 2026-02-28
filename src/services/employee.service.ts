import { pb } from '@/lib/pocketbase'
import { Collections } from '@/types/pocketbase-types'
import { Employee } from '@/types'
import { EmployeesRecord } from '@/types/pocketbase-types'
import type { ListResult } from 'pocketbase'

// Map PocketBase response to UI Employee type if needed, or use directly
// For now, we will use the generated types directly in the app to avoid mapping overhead

export const employeeService = {
  getAll: async (page = 1, perPage = 50): Promise<ListResult<Employee>> => {
    return await pb.collection(Collections.Employees).getList(page, perPage, {
      sort: '-created',
      expand: 'department',
    })
  },

  getActive: async (page = 1, perPage = 50): Promise<ListResult<Employee>> => {
    return await pb.collection(Collections.Employees).getList(page, perPage, {
      sort: '-created',
      expand: 'department',
      filter: 'isArchived = false'
    })
  },

  getAllActive: async (): Promise<Employee[]> => {
    return await pb.collection(Collections.Employees).getFullList({
      sort: '-created',
      expand: 'department',
      filter: 'isArchived = false'
    })
  },

  create: async (data: Partial<EmployeesRecord>): Promise<Employee> => {
    return await pb.collection(Collections.Employees).create(data)
  },

  update: async (id: string, data: Partial<EmployeesRecord>): Promise<Employee> => {
    return await pb.collection(Collections.Employees).update(id, data)
  },

  softDelete: async (id: string): Promise<Employee> => {
    return await pb.collection(Collections.Employees).update(id, {
      isArchived: true,
      archiveDate: new Date().toISOString()
    })
  },

  restore: async (id: string): Promise<Employee> => {
    return await pb.collection(Collections.Employees).update(id, {
      isArchived: false,
      archiveDate: ""
    })
  }
}
