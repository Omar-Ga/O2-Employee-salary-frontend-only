import { pb } from "@/lib/pocketbase"
import { Transaction } from "@/types"
import type { ListResult } from 'pocketbase'

export const transactionService = {
    // Get active (open) transactions
    getAll: async (page = 1, perPage = 50, employeeId?: string): Promise<ListResult<Transaction>> => {
        const filter = employeeId
            ? `employeeId = "${employeeId}" && isClosed = false`
            : 'isClosed = false'

        const result = await pb.collection('transactions').getList(page, perPage, {
            filter,
            sort: '-created',
        })
        return result as unknown as ListResult<Transaction>
    },

    getOpen: async (page = 1, perPage = 50): Promise<ListResult<Transaction>> => {
        const result = await pb.collection('transactions').getList(page, perPage, {
            filter: 'isClosed = false',
            sort: '-created',
        })
        return result as unknown as ListResult<Transaction>
    },

    getForEmployees: async (employeeIds: string[]): Promise<Transaction[]> => {
        if (employeeIds.length === 0) return []
        // Construct filter: (employeeId = 'id1' || employeeId = 'id2') && isClosed = false
        const idFilter = employeeIds.map(id => `employeeId = "${id}"`).join(' || ')
        const filter = `(${idFilter}) && isClosed = false`
        
        return await pb.collection('transactions').getFullList({
            filter,
            sort: '-created',
        })
    },

    create: async (data: Partial<Transaction>) => {
        return await pb.collection('transactions').create(data)
    },

    createBulk: async (data: Partial<Transaction>[]) => {
        const batch = pb.createBatch()
        data.forEach(item => {
            batch.collection('transactions').create(item)
        })
        return await batch.send()
    },

    delete: async (id: string) => {
        return await pb.collection('transactions').delete(id)
    }
}
