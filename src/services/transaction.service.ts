import { Transaction } from "@/types"

// Mock ListResult
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

export const transactionService = {
    getAll: async (_page = 1, _perPage = 50, _employeeId?: string): Promise<ListResult<Transaction>> => {
        return Promise.resolve(emptyList)
    },

    getOpen: async (_page = 1, _perPage = 50): Promise<ListResult<Transaction>> => {
        return Promise.resolve(emptyList)
    },

    getForEmployees: async (_employeeIds: string[]): Promise<Transaction[]> => {
        return Promise.resolve([])
    },

    create: async (data: Partial<Transaction>) => {
        return Promise.resolve({ id: 'dummy-id', ...data } as Transaction)
    },

    createBulk: async (_data: Partial<Transaction>[]) => {
        return Promise.resolve(true)
    },

    delete: async (_id: string) => {
        return Promise.resolve(true)
    }
}
