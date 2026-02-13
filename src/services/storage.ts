export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch (e) {
      console.error('Storage error', e)
      return defaultValue
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('Storage set error', e)
    }
  },
}
