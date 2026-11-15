import './styles/index.css'
import icons from './partials/icons.html?raw'
import header from './partials/header.html?raw'
import footer from './partials/footer.html?raw'

const files = import.meta.glob('./views/*.html', { query: '?raw', import: 'default', eager: true })
const order = ['home', 'login', 'register', 'reset', 'dashboard', 'detect', 'loading', 'results', 'error', 'articles', 'routine', 'article', 'progress']
const views = order.map((name) => files[`./views/${name}.html`] || '').join('')

document.getElementById('root').innerHTML = icons + header + views + footer

import('./app/app.js').then(({ boot }) => boot())
