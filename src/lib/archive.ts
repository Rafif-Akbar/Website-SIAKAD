import { getSettings, updateSettings } from './api'

export interface ArchiveItem {
  id: string
  type: string
  label: string
  detail?: string
  archivedAt: string
  data: unknown
}

function isArchiveItem(value: unknown): value is ArchiveItem {
  return Boolean(value && typeof value === 'object' && 'id' in value && 'type' in value && 'label' in value)
}

export async function getArchiveItems() {
  const data = await getSettings()
  const items = data.settings.arsip?.items
  return Array.isArray(items) ? items.filter(isArchiveItem) : []
}

export async function addArchiveItem(item: Omit<ArchiveItem, 'archivedAt'>) {
  const current = await getArchiveItems().catch(() => [])
  const nextItem: ArchiveItem = {
    ...item,
    archivedAt: new Date().toISOString(),
  }
  await updateSettings('arsip', { items: [nextItem, ...current] })
  return nextItem
}

export async function saveArchiveItems(items: ArchiveItem[]) {
  await updateSettings('arsip', { items })
}
