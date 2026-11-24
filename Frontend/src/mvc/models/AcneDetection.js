import { api } from '../../api'
import { DetectionResult } from './DetectionResult'

export class AcneDetection {
  constructor({ detectionId = 0, userId = 0, imagePath = '', detectionDate = null, file = null } = {}) {
    this.detectionId = detectionId
    this.userId = userId
    this.imagePath = imagePath
    this.detectionDate = detectionDate
    this.file = file
  }

  async processDetection() {
    const res = await api.detect(this.file)
    this.detectionId = res.id ?? this.detectionId
    this.detectionDate = res.created_at || new Date().toISOString()
    return DetectionResult.fromApi(res)
  }

  async saveDetection() {
    return api.saveEntry(this.detectionId)
  }
}
