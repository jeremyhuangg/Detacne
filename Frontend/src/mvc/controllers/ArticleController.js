import { api } from '../../api'
import { Article } from '../models/Article'

export class ArticleController {
  constructor() {
    this.articleModel = Article
  }

  async getArticles() {
    return (await api.articles.list()).map(Article.fromApi)
  }

  async getArticlesDetail(id) {
    return Article.fromApi(await api.articles.get(id))
  }
}
