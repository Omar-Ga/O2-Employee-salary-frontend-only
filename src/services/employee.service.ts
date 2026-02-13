import { nanoid } from 'nanoid'
import { Employee } from '@/types'
import { storage } from './storage'

const KEY = 'oxygen_employees'

const MOCK_DATA: Employee[] = [
  {
    id: '1',
    name: 'Alex Jensen',
    email: 'alex.jensen@example.com',
    nationalId: '1234567890',
    phone: '01000000001',
    jobTitle: 'Senior UX Designer',
    department: 'Design',
    monthlySalary: 6250,
    workHours: 270,
    isArchived: false,
    grade: 'Good',
    scores: { performance: 8, dedication: 9, responsibility: 8 }
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    nationalId: '1234567891',
    phone: '01000000002',
    jobTitle: 'Frontend Developer',
    department: 'Engineering',
    monthlySalary: 6800,
    workHours: 270,
    isArchived: false,
    grade: 'Excellent',
    scores: { performance: 10, dedication: 9, responsibility: 9 }
  },
  {
    id: '3',
    name: 'Marcus Thorne',
    email: 'marcus.thorne@example.com',
    nationalId: '1234567892',
    phone: '01000000003',
    jobTitle: 'Product Manager',
    department: 'Product',
    monthlySalary: 7100,
    workHours: 270,
    isArchived: false, // In mock data he is active, but image says "On Leave" which is a status, not archived.
    grade: 'Good',
    scores: { performance: 7, dedication: 8, responsibility: 8 }
  }
]

export const employeeService = {
  getAll: (): Employee[] => {
    const data = storage.get<Employee[]>(KEY, [])
    if (data.length === 0) {
      // Seed mock data
      storage.set(KEY, MOCK_DATA)
      return MOCK_DATA
    }
    return data
  },
  create: (data: Omit<Employee, 'id' | 'isArchived'>): Employee => {
    const employees = employeeService.getAll()
    const newEmployee: Employee = { ...data, id: nanoid(), isArchived: false }
    storage.set(KEY, [...employees, newEmployee])
    return newEmployee
  },
  update: (id: string, data: Partial<Employee>): void => {
    const employees = employeeService.getAll().map(e => e.id === id ? { ...e, ...data } : e)
    storage.set(KEY, employees)
  },
  softDelete: (id: string): void => {
    employeeService.update(id, { isArchived: true })
  },
  restore: (id: string): void => {
    employeeService.update(id, { isArchived: false })
  }
}
