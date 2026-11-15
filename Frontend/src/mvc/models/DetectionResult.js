import { ACNE_TYPES } from './AcneType'
import { DetectedAcneType } from './DetectedAcneType'

export class DetectionResult {
  constructor({ resultId = 0, detectionId = 0, acneType = '', recomendation = '', raw = {} } = {}) {
    this.resultId = resultId
    this.detectionId = detectionId
    this.acneType = acneType
    this.recomendation = recomendation
    this.raw = raw // payload API asli (counts, total, severity, boxes)
  }

  static fromApi(r = {}) {
    const counts = r.counts || {}
    const top = Object.keys(counts).filter((k) => Number(counts[k]) > 0).sort((a, b) => Number(counts[b]) - Number(counts[a]))
    const res = new DetectionResult({ resultId: r.id ?? 0, detectionId: r.detection_id ?? r.id ?? 0, acneType: top.join(', '), raw: r })
    res.recomendation = res.generateRecomendation()
    return res
  }

  getResult() {
    return this.raw
  }

  getDetectedTypes() {
    return Object.keys(this.raw.counts || {})
      .filter((k) => ACNE_TYPES[k])
      .map((k) => new DetectedAcneType({ resultId: this.resultId, acneTypeId: ACNE_TYPES[k].acneTypeId }))
  }

  generateRecomendation() {
    const sev = this.raw.severity
    if (!this.raw.total) return 'Tidak ada jerawat terdeteksi. Tetap jaga kebersihan wajah dan pakai tabir surya.'
    if (sev === 'Ringan') return 'Pakai pembersih lembut, pelembap, dan tabir surya. Pantau secara berkala.'
    if (sev === 'Sedang') return 'Tambahkan bahan aktif seperti salicylic acid atau niacinamide secara bertahap.'
    return 'Disarankan berkonsultasi dengan dokter kulit.'
  }
}
