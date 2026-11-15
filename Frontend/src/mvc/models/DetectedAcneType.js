export class DetectedAcneType {
  constructor({ detectedId = 0, resultId = 0, acneTypeId = 0 } = {}) {
    this.detectedId = detectedId
    this.resultId = resultId
    this.acneTypeId = acneTypeId
  }
}
