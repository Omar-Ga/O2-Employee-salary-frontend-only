import { useQuery } from '@tanstack/react-query'
import { departmentService } from '@/services/department.service'
import { useMemo } from 'react'
import type { DepartmentConfig } from '@/lib/departments'
import { DepartmentsResponse } from '@/types'

export const useDepartments = () => {
    const { data: departments = [], isLoading } = useQuery<DepartmentsResponse[]>({
        queryKey: ['departments'],
        queryFn: departmentService.getAll,
        staleTime: Infinity // Departments rarely change
    })

    const departmentConfig = useMemo(() => {
        if (departments.length === 0) return []

        // Transform PB departments into DepartmentConfig structure
        // 1. Find root departments (type=structural usually, or no parentId)
        // Our seed used type=structural for roots.

        const rootDepts = departments.filter((d) => d.type === 'structural')
        const subDepts = departments.filter((d) => d.type === 'functional')

        return rootDepts.map((root) => {
            // Find simpler way to map ID? 
            // Our seed didn't preserve IDs like "engineering". 
            // We can match by name with static config to get colors?

            const colorPalette = (root as any).colorPalette || 'gray'

            const subs = subDepts
                .filter((sub) => sub.parentId === root.id)
                .map((sub) => ({
                    id: sub.id,
                    label: sub.name
                }))

            return {
                id: root.id,
                label: root.name,
                colorPalette: colorPalette, // Fallback color
                subDepartments: subs
            } as DepartmentConfig
        })

    }, [departments])

    return {
        departments: departmentConfig,
        rawDepartments: departments,
        isLoading
    }
}
