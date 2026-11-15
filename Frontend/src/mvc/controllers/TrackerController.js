import { api } from '../../api'
import { AcneTracker } from '../models/AcneTracker'

const KEY = 'detacneEntries'

export class TrackerController {
  constructor() {
    this.trackerModel = AcneTracker
  }

  getTracker(userId) {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]').map((e) => { const t = AcneTracker.fromEntry(e); t.userId = userId; return t })
    } catch {
      return []
    }
  }

  getSummary(userId) {
    const list = this.getTracker(userId)
    return list.length ? list[list.length - 1].getMontlySummary(list) : { month: 0, year: 0, checks: 0, total: 0, average: 0 }
  }

  async addTracker(userId, entry) {
    await api.saveEntry(entry.id).catch(() => {})
    return AcneTracker.fromEntry({ ...entry, userId })
  }

  async deleteTracker(userId, trackerId) {
    if (trackerId !== undefined) await api.progress.remove(trackerId).catch(() => {})
    return true
  }
}
