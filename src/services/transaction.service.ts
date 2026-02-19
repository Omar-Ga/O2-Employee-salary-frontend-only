import { pb } from "@/lib/pocketbase"
import { Transaction } from "@/types"

export const transactionService = {
    // Get active (open) transactions
    getAll: async (employeeId?: string) => {
        const filter = employeeId
            ? `employeeId = "${employeeId}" && isClosed = false`
            : 'isClosed = false'

        const result = await pb.collection('transactions').getFullList({
            filter,
            sort: '-created',
        })
        return result as unknown as Transaction[]
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
