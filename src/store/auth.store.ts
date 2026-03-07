import { create } from 'zustand';
import type { UsersResponse } from '@/types';

interface AuthState {
    user: UsersResponse | null;
    isLoading: boolean;
    login: (data: UsersResponse, token: string) => void;
    logout: () => void;
    updateUser: (user: UsersResponse) => void;
    authenticate: (email: string, pass: string) => Promise<void>;
}

// Dummy user for UI testing
const DUMMY_USER: UsersResponse = {
    id: 'dummy-admin-id',
    email: 'admin@o2mation.com',
    name: 'UI Designer Admin',
    role: 'admin',
    avatar: '',
    created: new Date().toISOString() as any,
    updated: new Date().toISOString() as any,
    collectionId: 'users',
    collectionName: 'users',
    verified: true,
    emailVisibility: true,
    password: '',
    tokenKey: ''
};

export const useAuthStore = create<AuthState>((set) => ({
    // Default to logged IN so we skip the login screen
    user: DUMMY_USER,
    isLoading: false,

    login: (user, _token) => {
        set({ user });
    },

    logout: () => {
        set({ user: null });
    },

    updateUser: (user) => {
        set({ user });
    },

    authenticate: async (_email, _pass) => {
        set({ isLoading: true });
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ user: DUMMY_USER, isLoading: false });
    }
}));
