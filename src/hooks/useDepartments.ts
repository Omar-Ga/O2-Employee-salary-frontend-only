import { useQuery } from '@tanstack/react-query'
import { departmentService } from '@/services/department.service'
import { DEPARTMENT_CONFIG as STATIC_CONFIG } from '@/lib/departments'
import { useMemo } from 'react'
import type { DepartmentConfig } from '@/lib/departments'

export const useDepartments = () => {
    const { data: departments = [], isLoading } = useQuery({
        queryKey: ['departments'],
        queryFn: departmentService.getAll,
        staleTime: Infinity // Departments rarely change
    })

    const departmentConfig = useMemo(() => {
        if (departments.length === 0) return STATIC_CONFIG

        // Transform PB departments into DepartmentConfig structure
        // 1. Find root departments (type=structural usually, or no parentId)
        // Our seed used type=structural for roots.

        const rootDepts = departments.filter((d: any) => d.type === 'structural')
        const subDepts = departments.filter((d: any) => d.type === 'functional')

        return rootDepts.map((root: any) => {
            // Find simpler way to map ID? 
            // Our seed didn't preserve IDs like "engineering". 
            // We can match by name with static config to get colors?

            const staticMatch = STATIC_CONFIG.find(c => c.label === root.name || c.id === root.name.toLowerCase())

            const subs = subDepts
                .filter((sub: any) => sub.parentId === root.id)
                .map((sub: any) => ({
                    id: sub.id,
                    label: sub.name
                }))

            return {
                id: root.id,
                label: root.name,
                colorPalette: staticMatch?.colorPalette || 'gray', // Fallback color
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
