// Tabel penghubung DetectionResult (1) -- (0..*) DetectedAcneType (0..*) -- (1) AcneType
export class DetectedAcneType {
  constructor({ detectedId = 0, resultId = 0, acneTypeId = 0 } = {}) {
    this.detectedId = detectedId
    this.resultId = resultId
    this.acneTypeId = acneTypeId
  }
}
