
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


export const getParentDepartment = (departments: DepartmentConfig[], subDeptId: string): DepartmentConfig | undefined => {
  return departments.find(d =>
    d.subDepartments.some(sub => sub.id === subDeptId)
  )
}

export const getDepartmentColor = (departments: DepartmentConfig[], subDeptId: string) => {
  const parent = getParentDepartment(departments, subDeptId)
  return parent?.colorPalette || "gray"
}
