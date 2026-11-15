import { SkincareRoutine } from '../models/SkincareRoutine'
import { RoutineStep } from '../models/RoutineStep'

const KEY = 'detacneRoutinesV2'

export class RoutineController {
  constructor() {
    this.routineModel = SkincareRoutine
    this.stepModel = RoutineStep
  }

  // Daftar langkah rutinitas milik user (disimpan di browser)
  getRoutines(userId) {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]').map((t) => ({ ...t, userId }))
    } catch {
      return []
    }
  }

  createRoutine(routine) {
    const list = this.getRoutines()
    list.push(routine)
    return this.#save(list)
  }

  updateRoutine(routine) {
    const list = this.getRoutines().map((r) => (r.id === routine.id ? routine : r))
    return this.#save(list)
  }

  deleteRoutine(id) {
    return this.#save(this.getRoutines().filter((r) => r.id !== id))
  }

  #save(list) {
    list.sort((a, b) => a.time.localeCompare(b.time))
    localStorage.setItem(KEY, JSON.stringify(list))
    return list
  }
}
