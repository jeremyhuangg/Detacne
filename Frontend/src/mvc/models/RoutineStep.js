export class RoutineStep {
  constructor({ stepId = 0, routineId = 0, productName = '', timeOfUse = '' } = {}) {
    this.stepId = stepId
    this.routineId = routineId
    this.productName = productName
    this.timeOfUse = timeOfUse
  }

  static fromTask(t) {
    return new RoutineStep({ stepId: t.id, routineId: t.routineId || 0, productName: t.name, timeOfUse: t.time })
  }

  addStep(steps) {
    steps.push(this)
    return steps
  }

  updateStep(steps, patch) {
    Object.assign(this, patch)
    const i = steps.findIndex((s) => s.stepId === this.stepId)
    if (i > -1) steps[i] = this
    return steps
  }

  removeStep(steps) {
    return steps.filter((s) => s.stepId !== this.stepId)
  }
}
