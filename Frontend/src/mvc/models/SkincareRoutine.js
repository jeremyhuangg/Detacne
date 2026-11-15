import { RoutineStep } from './RoutineStep'

export class SkincareRoutine {
  constructor({ routineId = 0, userId = 0, createdAt = null, steps = [] } = {}) {
    this.routineId = routineId
    this.userId = userId
    this.createdAt = createdAt
    this.steps = steps // 1..* RoutineStep
  }

  createRoutine(list, routine) {
    routine.createdAt = routine.createdAt || new Date().toISOString()
    list.push(routine)
    return list
  }

  updateRoutine(list, routine) {
    const i = list.findIndex((r) => r.routineId === routine.routineId)
    if (i > -1) list[i] = routine
    return list
  }

  deleteRoutine(list, routineId) {
    return list.filter((r) => r.routineId !== routineId)
  }

  static fromTasks(tasks = [], userId = 0) {
    return new SkincareRoutine({ routineId: 1, userId, createdAt: new Date().toISOString(), steps: tasks.map(RoutineStep.fromTask) })
  }
}
