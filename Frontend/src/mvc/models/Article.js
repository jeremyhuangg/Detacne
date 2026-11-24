import { api } from '../../api'

export class Article {
  constructor({ articleId = 0, title = '', content = '', imagePath = '', publishDate = null, extra = {} } = {}) {
    this.articleId = articleId
    this.title = title
    this.content = content
    this.imagePath = imagePath
    this.publishDate = publishDate
    this.extra = extra
  }

  static fromApi(a = {}) {
    const { id, title, body, img, date, ...rest } = a
    return new Article({ articleId: id, title, content: body || '', imagePath: img || '', publishDate: date || null, extra: rest })
  }

  toApi() {
    return { ...this.extra, id: this.articleId, title: this.title, body: this.content, img: this.imagePath, date: this.publishDate }
  }

  async create() {
    return Article.fromApi(await api.articles.create(this.toApi()))
  }

  async update() {
    return Article.fromApi(await api.articles.update(this.articleId, this.toApi()))
  }

  async delete() {
    return api.articles.remove(this.articleId)
  }
}
