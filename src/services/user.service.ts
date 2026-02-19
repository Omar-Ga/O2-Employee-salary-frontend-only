import { pb } from '@/lib/pocketbase'
import { Collections } from '@/types/pocketbase-types-manual'
import { UsersResponse, UsersRecord } from '@/types'

export const userService = {
    getAll: async (): Promise<UsersResponse[]> => {
        return await pb.collection(Collections.Users).getFullList<UsersResponse>({
            sort: '-created',
        })
    },

    create: async (data: Partial<UsersRecord>): Promise<UsersResponse> => {
        return await pb.collection(Collections.Users).create<UsersResponse>(data)
    },

    update: async (id: string, data: Partial<UsersRecord>): Promise<UsersResponse> => {
        return await pb.collection(Collections.Users).update<UsersResponse>(id, data)
    },

    delete: async (id: string): Promise<boolean> => {
        return await pb.collection(Collections.Users).delete(id)
    }
}
