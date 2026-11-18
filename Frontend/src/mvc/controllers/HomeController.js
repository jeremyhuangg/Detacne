import { User } from '../models/User'
import { AcneDetection } from '../models/AcneDetection'
import { AcneTracker } from '../models/AcneTracker'
import { SkincareRoutine } from '../models/SkincareRoutine'
import { Article } from '../models/Article'
import { TrackerController } from './TrackerController'
import { RoutineController } from './RoutineController'

export class HomeController {
  constructor({ articles = () => [] } = {}) {
    this.userModel = User
    this.detectionModel = AcneDetection
    this.trackerModel = AcneTracker
    this.routineModel = SkincareRoutine
    this.articleModel = Article
    this._tracker = new TrackerController()
    this._routine = new RoutineController()
    this._articles = articles
  }

  getUserGreeting() {
    return User.current()?.name || 'Teman'
  }

  getDetectionCount() {
    return this._tracker.getTracker().length
  }

  getTrackerPreview() {
    const l = this._tracker.getTracker()
    return l[l.length - 1] || null
  }

  getRoutinePreview(isOn = () => true) {
    return this._routine.getRoutines().filter(isOn).slice(0, 3)
  }

  getArticlePreview() {
    return this._articles().filter((a) => a.status !== 'draft').slice(0, 3)
  }
}
