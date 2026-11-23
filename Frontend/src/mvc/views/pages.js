
export class LoginPage {
  constructor(ui, auth) {
    this.ui = ui
    this.auth = auth
    this.email = ''
    this.password = ''
  }

  showLoginForm() {
    this.ui.go('login')
  }

  async submitLogin(form) {
    const d = new FormData(form)
    this.email = this.ui.normEmail(d.get('email'))
    this.password = d.get('password')
    await this.signIn()
  }

  async signIn() {
    try {
      const user = await this.auth.login(this.email, this.password)
      this.ui.onAuthSuccess(user, 'Berhasil masuk.')
    } catch (err) {
      if (err.status === 403) return this.verifyFirst()
      this.showError(err.message)
    }
  }

  async verifyFirst() {
    try {
      await this.auth.sendOtp(this.email)
    } catch (err) {
      return this.showError(err.message)
    }
    this.ui.toast('Akun belum diverifikasi. Kami mengirim kode ke emailmu.')
    this.ui.askOtp(this.email, () => this.signIn())
  }

  showError(message) {
    this.ui.toast(message)
  }
}

export class RegisterPage {
  constructor(ui, auth) {
    this.ui = ui
    this.auth = auth
    this.name = ''
    this.email = ''
    this.password = ''
    this.gender = false
    this.DOB = null
  }

  showRegisterForm() {
    this.ui.go('register')
  }

  async submitRegister(form) {
    if (!this.ui.validateRegister(form)) {
      this.ui.toast('Periksa kembali isian yang ditandai.')
      return
    }
    const d = new FormData(form)
    this.name = d.get('name').trim().replace(/\s+/g, ' ')
    this.email = this.ui.normEmail(d.get('email'))
    this.password = d.get('password')
    this.gender = d.get('gender') === 'Laki-laki'
    this.DOB = d.get('birthdate')
    try {
      await this.auth.register(this.name, this.email, this.password, this.gender, this.DOB)
    } catch (err) {
      this.ui.toast(err.message)
      return
    }
    try {
      await this.auth.sendOtp(this.email)
      this.ui.toast('Akun dibuat. Kami mengirim kode verifikasi ke emailmu.')
    } catch {
      this.ui.toast('Akun dibuat, tapi kode belum terkirim. Tekan "Kirim ulang kode".')
    }
    this.ui.askOtp(this.email, () => this.showSuccess())
  }

  async showSuccess() {
    try {
      const user = await this.auth.login(this.email, this.password)
      this.ui.onAuthSuccess(user, 'Akun berhasil dibuat.')
    } catch {
      this.ui.toast('Akun sudah aktif. Silakan masuk.')
      this.ui.go('login')
    }
  }
}

export class HomePage {
  constructor(ui, home) {
    this.ui = ui
    this.home = home
    this.detectionCount = 0
    this.trackerPreview = null
    this.routinePreview = null
    this.articlePreview = null
  }

  displayGreeting() {
    this.ui.setText('userGreeting', this.home.getUserGreeting())
  }

  displayDetectionCount() {
    this.detectionCount = this.home.getDetectionCount()
    this.ui.setText('dsCount', this.detectionCount)
    this.ui.setText('dsCountNote', this.detectionCount ? 'Tersimpan di browser ini' : 'Belum ada pemeriksaan')
  }

  displayTrackerPreview() {
    this.trackerPreview = this.home.getTrackerPreview()
    this.ui.renderTrackerPreview(this.trackerPreview)
  }

  displayRoutinePreview() {
    this.routinePreview = this.home.getRoutinePreview((t) => this.ui.isRoutineToday(t))
    this.ui.renderRoutinePreview(this.routinePreview)
  }

  displayArticlePreview() {
    this.articlePreview = this.home.getArticlePreview()
    return this.articlePreview
  }
}

export class DetectionPage {
  constructor(ui, detection) {
    this.ui = ui
    this.detection = detection
    this.imageFile = null
    this.previewImage = ''
  }

  selectImage(file) {
    const err = this.detection.validateImage(file)
    if (err) {
      this.ui.toast(err)
      return false
    }
    this.imageFile = file
    this.previewImage = URL.createObjectURL(file)
    return true
  }

  uploadImage() {
    return this.detection.detectAcne(this.imageFile)
  }

  showResult() {
    this.ui.go('results')
  }
}

export class ResultPage {
  constructor(ui, tracker) {
    this.ui = ui
    this.tracker = tracker
    this.result = null
    this.recomendation = ''
  }

  displayResult(result) {
    this.result = result
    this.recomendation = result.recomendation
    this.ui.renderResult(result.getResult())
  }

  async saveToTracker(userId, entry) {
    return this.tracker.addTracker(userId, entry)
  }
}

export class TrackerPage {
  constructor(ui, tracker) {
    this.ui = ui
    this.tracker = tracker
    this.trackerData = []
  }

  showTracker(userId) {
    this.trackerData = this.tracker.getTracker(userId)
    this.ui.renderProgress()
    return this.trackerData
  }

  filterPeriod() {
    this.ui.renderChart()
  }

  addTracker(userId, entry) {
    return this.tracker.addTracker(userId, entry)
  }

  deleteTracker(userId, trackerId) {
    return this.tracker.deleteTracker(userId, trackerId)
  }
}

export class RoutinePage {
  constructor(ui, routine) {
    this.ui = ui
    this.routine = routine
    this.routineList = []
  }

  showRoutine(userId) {
    this.routineList = this.routine.getRoutines(userId)
    this.ui.renderRoutine()
    return this.routineList
  }

  createRoutine(r) {
    return (this.routineList = this.routine.createRoutine(r))
  }

  updateRoutine(r) {
    return (this.routineList = this.routine.updateRoutine(r))
  }

  deleteRoutine(id) {
    return (this.routineList = this.routine.deleteRoutine(id))
  }
}

export class ArticlePage {
  constructor(ui, article) {
    this.ui = ui
    this.article = article
    this.articles = []
  }

  async showArticleList() {
    this.articles = await this.article.getArticles()
    return this.articles
  }

  async showArticleDetail(id) {
    return this.article.getArticlesDetail(id)
  }
}

export class AdminArticlePage {
  constructor(ui, admin) {
    this.ui = ui
    this.admin = admin
    this.articles = null
  }

  showManageArticle() {
    this.ui.go('dashboard?tab=artikel')
  }

  createArticle(data) {
    return this.admin.createArticle(data)
  }

  updateArticle(data) {
    return this.admin.updateArticle(data)
  }

  deleteArticle(id) {
    return this.admin.deleteArticle(id)
  }
}

export class AboutUsPage {
  constructor(ui) {
    this.ui = ui
  }

  displayAboutUs() {
    this.ui.scrollTo('cara-kerja')
  }
}
