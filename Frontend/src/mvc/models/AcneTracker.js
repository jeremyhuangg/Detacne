import { api } from '../../api'

export class AcneTracker {
  constructor({ trackerId = 0, userId = 0, date = null, acneCount = 0, extra = {} } = {}) {
    this.trackerId = trackerId
    this.userId = userId
    this.date = date
    this.acneCount = acneCount
    this.extra = extra // severity, counts, boxes, photo, note
  }

  static fromEntry(e = {}) {
    return new AcneTracker({ trackerId: e.id, date: e.ts, acneCount: Number(e.total) || 0, extra: e })
  }

  static async fetchAll() {
    const res = await api.progress.list().catch(() => ({ items: [] }))
    return (res.items || res || []).map(AcneTracker.fromEntry)
  }

  getMontlySummary(list = []) {
    const m = new Date(this.date || Date.now())
    const same = list.filter((t) => { const d = new Date(t.date); return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth() })
    const total = same.reduce((a, t) => a + t.acneCount, 0)
    return { month: m.getMonth() + 1, year: m.getFullYear(), checks: same.length, total, average: same.length ? Math.round((total / same.length) * 10) / 10 : 0 }
  }
}
