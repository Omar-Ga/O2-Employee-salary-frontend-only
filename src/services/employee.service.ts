import { pb } from '@/lib/pocketbase'
import { Collections } from '@/types/pocketbase-types'
import { Employee } from '@/types'

// Map PocketBase response to UI Employee type if needed, or use directly
// For now, we will use the generated types directly in the app to avoid mapping overhead

export const employeeService = {
  getAll: async (): Promise<Employee[]> => {
    return await pb.collection(Collections.Employees).getFullList({
      sort: '-created',
      expand: 'department',
    })
  },

  create: async (data: any): Promise<Employee> => {
    return await pb.collection(Collections.Employees).create(data)
  },

  update: async (id: string, data: any): Promise<Employee> => {
    return await pb.collection(Collections.Employees).update(id, data)
  },

  softDelete: async (id: string): Promise<Employee> => {
    return await pb.collection(Collections.Employees).update(id, { isArchived: true })
  },

  restore: async (id: string): Promise<Employee> => {
    return await pb.collection(Collections.Employees).update(id, { isArchived: false })
  }
}
