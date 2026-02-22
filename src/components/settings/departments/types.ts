export type DepartmentType = 'structural' | 'functional' | 'default'

export interface DepartmentNode {
  id: string
  name: string
  type: DepartmentType
  children?: DepartmentNode[]
}
