import { pb } from '@/lib/pocketbase'
import { Collections } from '@/types/pocketbase-types'
import { DepartmentsResponse } from '@/types'

export const departmentService = {
    getAll: async (): Promise<DepartmentsResponse[]> => {
        return await pb.collection(Collections.Departments).getFullList({
            sort: 'created',
        })
    },

    create: async (data: any): Promise<DepartmentsResponse> => {
        return await pb.collection(Collections.Departments).create(data)
    },

    update: async (id: string, data: any): Promise<DepartmentsResponse> => {
        return await pb.collection(Collections.Departments).update(id, data)
    },

    delete: async (id: string): Promise<boolean> => {
        return await pb.collection(Collections.Departments).delete(id)
    }
}
