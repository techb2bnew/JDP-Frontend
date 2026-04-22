export const getTodayLocalDateString = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getYesterdayLocalDateString = (): string => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  now.setDate(now.getDate() - 1)
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateInput = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value || '').trim())
  if (!match) return null
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const parsed = new Date(year, monthIndex, day)
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== monthIndex ||
    parsed.getDate() !== day
  ) {
    return null
  }
  parsed.setHours(0, 0, 0, 0)
  return parsed
}

export const validateDobValue = (value: string): string | null => {
  const parsedDob = parseDateInput(value)
  if (!parsedDob) return 'Please enter a valid DOB'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (parsedDob.getTime() === today.getTime()) {
    return "DOB cannot be today's date"
  }
  if (parsedDob.getTime() > today.getTime()) {
    return 'DOB cannot be in the future'
  }

  return null
}
