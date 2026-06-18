import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './views/Home.vue'
import SnakeGame from './views/SnakeGame.vue'
import MoleGame from './views/MoleGame.vue'
import MinesweeperGame from './views/MinesweeperGame.vue'
import TetrisGame from './views/TetrisGame.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/snake', name: 'SnakeGame', component: SnakeGame },
  { path: '/mole', name: 'MoleGame', component: MoleGame },
  { path: '/minesweeper', name: 'MinesweeperGame', component: MinesweeperGame },
  { path: '/tetris', name: 'TetrisGame', component: TetrisGame }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
