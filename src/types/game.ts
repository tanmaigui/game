// 贪吃蛇
export interface Point {
  x: number
  y: number
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

export interface DirVector {
  x: number
  y: number
}

// 打地鼠
export type MoleType = 'normal' | 'golden' | 'bomb'

export interface Hole {
  id: number
  active: boolean
  type: MoleType
}

// 扫雷
export interface Cell {
  row: number
  col: number
  mine: boolean
  adjacentMines: number
}

export interface Level {
  rows: number
  cols: number
  mines: number
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

// 俄罗斯方块
export interface TetrisCell {
  filled: boolean
  color: string
  active?: boolean
}

export interface Piece {
  shape: number[][]
  color: string
}

export interface Position {
  x: number
  y: number
}
