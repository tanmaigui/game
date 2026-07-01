import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import Home from './views/Home.vue'
import SnakeGame from './views/SnakeGame.vue'
import MoleGame from './views/MoleGame.vue'
import MinesweeperGame from './views/MinesweeperGame.vue'
import TetrisGame from './views/TetrisGame.vue'
import SudokuGame from './views/SudokuGame.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Home },
  { path: '/snake', name: 'SnakeGame', component: SnakeGame },
  { path: '/mole', name: 'MoleGame', component: MoleGame },
  { path: '/minesweeper', name: 'MinesweeperGame', component: MinesweeperGame },
  { path: '/tetris', name: 'TetrisGame', component: TetrisGame },
  { path: '/sudoku', name: 'SudokuGame', component: SudokuGame }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
