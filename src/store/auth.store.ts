import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AppUser {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    role?: string;
}

interface AuthState {
    user: AppUser | null;
    isLoading: boolean;
    initialize: () => void;
    logout: () => Promise<void>;
    updateUser: (user: AppUser) => void;
    authenticate: (email: string, pass: string) => Promise<void>;
}

const mapSupabaseUser = (user: User | null): AppUser | null => {
    if (!user) return null;
    return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name,
        avatar: user.user_metadata?.avatar,
        role: user.user_metadata?.role || 'admin',
    };
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,

    initialize: () => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            set({ user: mapSupabaseUser(session?.user ?? null), isLoading: false });
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            set({ user: mapSupabaseUser(session?.user ?? null), isLoading: false });
        });
    },

    logout: async () => {
        set({ isLoading: true });
        await supabase.auth.signOut();
        set({ user: null, isLoading: false });
    },

    updateUser: (user) => {
        set({ user });
    },

    authenticate: async (email, password) => {
        set({ isLoading: true });
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            set({ isLoading: false });
            throw error;
        }
    }
}));

