export interface Department {
  id: string
  name: string
  type: 'structural' | 'functional' | 'default'
  children: Department[]
  collapsed?: boolean
  color?: string
}

export type DepartmentType = 'structural' | 'functional' | 'default'

export interface FlattenedItem {
  id: string
  name: string
  type: DepartmentType
  parentId: string | null
  depth: number
  index: number
  color?: string
  collapsed?: boolean
  childCount: number
}
