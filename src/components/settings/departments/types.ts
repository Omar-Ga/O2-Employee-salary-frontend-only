export interface Department {
  id: string
  name: string
  type: 'structural' | 'functional' | 'default'
  children: Department[]
  collapsed?: boolean
}

export type DepartmentType = 'structural' | 'functional' | 'default'

export interface FlattenedItem extends Department {
  parentId: string | null
  depth: number
  index: number
}
