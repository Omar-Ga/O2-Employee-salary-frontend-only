import { DepartmentsResponse } from '@/types'
import { supabase } from '@/lib/supabase'

export const departmentService = {
    getAll: async (): Promise<DepartmentsResponse[]> => {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        return (data || []).map(d => ({
            id: d.id,
            name: d.name,
            type: d.type,
            parentId: d.parent_id,
            colorPalette: d.color_palette,
            createdAt: d.created_at,
            updatedAt: d.updated_at
        })) as DepartmentsResponse[];
    },

    create: async (department: Partial<DepartmentsResponse>): Promise<DepartmentsResponse> => {
        const { data, error } = await supabase
            .from('departments')
            .insert({
                name: department.name,
                type: department.type,
                parent_id: department.parentId,
                color_palette: department.colorPalette
            } as any)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            type: data.type,
            parentId: data.parent_id,
            colorPalette: data.color_palette,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        } as DepartmentsResponse;
    },

    update: async (id: string, updates: Partial<DepartmentsResponse>): Promise<DepartmentsResponse> => {
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.parentId !== undefined) payload.parent_id = updates.parentId;
        if (updates.colorPalette !== undefined) payload.color_palette = updates.colorPalette;

        const { data, error } = await supabase
            .from('departments')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            type: data.type,
            parentId: data.parent_id,
            colorPalette: data.color_palette,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        } as DepartmentsResponse;
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return true;
    }
}
