import { DepartmentsResponse } from '@/types'

export const departmentService = {
    getAll: async (): Promise<DepartmentsResponse[]> => {
        return Promise.resolve([])
    },

    create: async (data: Partial<DepartmentsResponse>): Promise<DepartmentsResponse> => {
        return Promise.resolve({ id: 'dummy-id', ...data } as DepartmentsResponse)
    },

    update: async (id: string, data: Partial<DepartmentsResponse>): Promise<DepartmentsResponse> => {
        return Promise.resolve({ id, ...data } as DepartmentsResponse)
    },

    delete: async (_id: string): Promise<boolean> => {
        return Promise.resolve(true)
    }
}
