import { createListCollection } from "@chakra-ui/react"

export interface DepartmentConfig {
  id: string
  label: string // Translation key part or raw string
  subDepartments: SubDepartmentConfig[]
  colorPalette?: string
}

export interface SubDepartmentConfig {
  id: string
  label: string // Translation key part or raw string
}

export const STATIC_DEPARTMENT_CONFIG: DepartmentConfig[] = [
  {
    id: "engineering",
    label: "Engineering",
    colorPalette: "blue",
    subDepartments: [
      { id: "Frontend", label: "Frontend" },
      { id: "Backend", label: "Backend" },
      { id: "Quality Assurance", label: "Quality Assurance" },
      { id: "Engineering", label: "General Engineering" }, // Fallback for legacy data
    ]
  },
  {
    id: "design",
    label: "Design",
    colorPalette: "purple",
    subDepartments: [
      { id: "Product Design", label: "Product Design" },
      { id: "Graphic Design", label: "Graphic Design" },
      { id: "Design", label: "General Design" }, // Fallback
    ]
  },
  {
    id: "product",
    label: "Product",
    colorPalette: "pink",
    subDepartments: [
      { id: "Product Management", label: "Product Management" },
      { id: "Product", label: "General Product" }, // Fallback
    ]
  },
  {
    id: "finance",
    label: "Finance",
    colorPalette: "green",
    subDepartments: [
      { id: "Accounting", label: "Accounting" },
      { id: "Auditing", label: "Auditing" },
    ]
  },
  {
    id: "hr",
    label: "Human Resources",
    colorPalette: "orange",
    subDepartments: [
      { id: "Recruitment", label: "Recruitment" },
      { id: "Operations", label: "Operations" },
    ]
  }
]

// Keep for backward compatibility until all files updated, or remove if we update all
export const DEPARTMENT_CONFIG = STATIC_DEPARTMENT_CONFIG

// Helper to find which main department a sub-department belongs to
export const getParentDepartment = (subDeptId: string): DepartmentConfig | undefined => {
  return DEPARTMENT_CONFIG.find(d =>
    d.subDepartments.some(sub => sub.id === subDeptId)
  )
}

// Helper for the Select component
export const getDepartmentCollection = () => {
  const items = DEPARTMENT_CONFIG.flatMap(dept =>
    dept.subDepartments.map(sub => ({
      label: sub.label,
      value: sub.id,
      group: dept.label,
      groupColor: dept.colorPalette
    }))
  )
  return createListCollection({ items })
}

export const getDepartmentColor = (subDeptId: string) => {
  const parent = getParentDepartment(subDeptId)
  return parent?.colorPalette || "gray"
}
