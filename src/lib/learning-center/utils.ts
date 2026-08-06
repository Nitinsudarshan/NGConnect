export function isSessionActiveOrUpcoming(session: { date: string; start_time?: string | null; duration_minutes?: number | null }): boolean {
  if (!session.date) return false

  const now = new Date()

  // Parse YYYY-MM-DD
  const dateParts = session.date.substring(0, 10).split('-')
  const year = parseInt(dateParts[0], 10)
  const month = parseInt(dateParts[1], 10) - 1
  const day = parseInt(dateParts[2], 10)

  let hours = 23
  let minutes = 59

  if (session.start_time) {
    const timeParts = session.start_time.split(':')
    hours = parseInt(timeParts[0], 10) || 0
    minutes = parseInt(timeParts[1], 10) || 0
  }

  const sessionStart = new Date(year, month, day, hours, minutes, 0)
  const duration = session.duration_minutes || 60
  const sessionEnd = new Date(sessionStart.getTime() + duration * 60000)

  return now < sessionEnd
}
