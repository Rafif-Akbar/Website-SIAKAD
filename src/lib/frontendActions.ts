export function exportCsv<T extends object>(filename: string, rows: T[]) {
  if (rows.length === 0) {
    alert('Tidak ada data untuk diekspor')
    return
  }

  const headers = Object.keys(rows[0] as Record<string, unknown>)
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(header => escape((row as Record<string, unknown>)[header])).join(',')),
  ].join('\n')

  downloadText(`${filename}.csv`, csv, 'text/csv;charset=utf-8')
}

export function downloadText(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function printPage() {
  window.print()
}

export function readStored<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function store<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export interface ActivityItem {
  id: string
  action: string
  detail: string
  icon: string
  createdAt: string
}

export function addActivity(action: string, detail: string, icon = 'bi-info-circle') {
  const current = readStored<ActivityItem[]>('siakad_activities', [])
  const next = [
    {
      id: crypto.randomUUID(),
      action,
      detail,
      icon,
      createdAt: new Date().toISOString(),
    },
    ...current,
  ].slice(0, 50)

  store('siakad_activities', next)
}

export function getActivities() {
  return readStored<ActivityItem[]>('siakad_activities', [])
}

export function formatActivityTime(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))

  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`

  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}
