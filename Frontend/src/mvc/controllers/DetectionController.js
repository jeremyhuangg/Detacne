import { AcneDetection } from '../models/AcneDetection'
import { DetectionResult } from '../models/DetectionResult'

export class DetectionController {
  constructor() {
    this.detectionModel = AcneDetection
    this.resultModel = DetectionResult
    this.lastResult = null
  }

  // Mengembalikan pesan error, atau '' jika gambar valid
  validateImage(image) {
    if (!image) return 'Pilih foto terlebih dahulu.'
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) return 'Format belum didukung. Gunakan JPG, PNG, atau WEBP.'
    if (image.size > 10 * 1024 * 1024) return 'Ukuran foto melebihi 10 MB.'
    return ''
  }

  async detectAcne(image) {
    const err = this.validateImage(image)
    if (err) throw new Error(err)
    const detection = new AcneDetection({ file: image })
    this.lastResult = await detection.processDetection()
    return this.lastResult
  }

  getDetectionResult(id) {
    return this.lastResult && String(this.lastResult.detectionId) === String(id) ? this.lastResult : null
  }
}
