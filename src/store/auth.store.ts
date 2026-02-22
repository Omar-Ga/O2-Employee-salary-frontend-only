import { create } from 'zustand';
import { pb, type RecordModel } from '@/lib/pocketbase';
import type { UsersResponse } from '@/types';

interface AuthState {
    user: UsersResponse | null;
    isLoading: boolean;
    login: (data: UsersResponse, token: string) => void;
    logout: () => void;
    updateUser: (user: UsersResponse) => void;
    authenticate: (email: string, pass: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: pb.authStore.isValid ? (pb.authStore.record as UsersResponse) : null,
    isLoading: false,

    login: (user, token) => {
        pb.authStore.save(token, user as unknown as RecordModel);
        set({ user });
    },

    logout: () => {
        pb.authStore.clear();
        set({ user: null });
    },

    updateUser: (user) => {
        set({ user });
    },

    authenticate: async (email, pass) => {
        set({ isLoading: true });
        try {
            const authData = await pb.collection('users').authWithPassword<UsersResponse>(email, pass);
            set({ user: authData.record, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    }
}));

// Sync store with PocketBase authStore updates
pb.authStore.onChange((_token: string, model: RecordModel | null) => {
    useAuthStore.setState({ user: pb.authStore.isValid ? (model as UsersResponse) : null });
});
