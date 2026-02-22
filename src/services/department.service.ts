import { pb } from '@/lib/pocketbase'
import { Collections } from '@/types/pocketbase-types-manual'
import { DepartmentsResponse } from '@/types'
import { ClientResponseError } from 'pocketbase'

const handleError = (error: unknown) => {
    if (error instanceof ClientResponseError) {
        if (error.status === 400 && error.message.includes('auth')) {
            throw new Error("Authentication failed or token expired. Please log in again.");
        }
        throw new Error(error.message || "A database error occurred.");
    }
    if (error instanceof Error) {
        throw new Error(`Network or unexpected error: ${error.message}`);
    }
    throw new Error("An unknown error occurred.");
}

export const departmentService = {
    getAll: async (): Promise<DepartmentsResponse[]> => {
        try {
            return await pb.collection(Collections.Departments).getFullList({
                sort: 'created',
            })
        } catch (error) {
            throw handleError(error);
        }
    },

    create: async (data: any): Promise<DepartmentsResponse> => {
        try {
            return await pb.collection(Collections.Departments).create(data)
        } catch (error) {
            throw handleError(error);
        }
    },

    update: async (id: string, data: any): Promise<DepartmentsResponse> => {
        try {
            return await pb.collection(Collections.Departments).update(id, data)
        } catch (error) {
            throw handleError(error);
        }
    },

    delete: async (id: string): Promise<boolean> => {
        try {
            return await pb.collection(Collections.Departments).delete(id)
        } catch (error) {
            throw handleError(error);
        }
    }
}
