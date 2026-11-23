import { Article } from '../models/Article'

export class AdminArticleController {
  constructor() {
    this.articleModel = Article
  }

  createArticle(data) {
    return new Article(data).create()
  }

  updateArticle(data) {
    return new Article(data).update()
  }

  deleteArticle(id) {
    return new Article({ articleId: id }).delete()
  }
}
