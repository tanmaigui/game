import { ref } from 'vue'
import type { SudokuCell, SudokuDifficulty } from '@/types/game'

const DIFFICULTIES: Record<SudokuDifficulty, number> = {
  easy: 38,
  medium: 30,
  hard: 24
}

// 生成一个完整的数独解
function generateSolution(): number[][] {
  const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0))
  fillGrid(grid)
  return grid
}

function fillGrid(grid: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const num of nums) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num
            if (fillGrid(grid)) return true
            grid[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

function isValid(grid: number[][], row: number, col: number, num: number): boolean {
  // 检查行
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false
  }
  // 检查列
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false
  }
  // 检查3x3宫
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false
    }
  }
  return true
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 根据难度挖空
function createPuzzle(solution: number[][], difficulty: SudokuDifficulty): SudokuCell[][] {
  const cellsToKeep = DIFFICULTIES[difficulty]
  const cellsToRemove = 81 - cellsToKeep

  // 创建所有位置的列表并随机打乱
  const positions: { r: number; c: number }[] = []
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push({ r, c })
    }
  }
  const shuffled = shuffle(positions)
  const toRemove = new Set(shuffled.slice(0, cellsToRemove).map(p => `${p.r},${p.c}`))

  const puzzle: SudokuCell[][] = Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => {
      const isGiven = !toRemove.has(`${r},${c}`)
      return {
        value: isGiven ? solution[r][c] : 0,
        solution: solution[r][c],
        isGiven,
        isError: false,
        notes: [] as number[]
      }
    })
  )
  return puzzle
}

export function useSudoku() {
  const difficulty = ref<SudokuDifficulty>('easy')
  const board = ref<SudokuCell[][]>([])
  const selectedRow = ref(-1)
  const selectedCol = ref(-1)
  const isRunning = ref(false)
  const isPaused = ref(false)
  const isCompleted = ref(false)
  const noteMode = ref(false)
  const timer = ref(0)
  const mistakeCount = ref(0)
  const highScore = ref<Record<string, number>>(
    JSON.parse(localStorage.getItem('sudoku_high_score') || '{}')
  )

  let gameTimer: ReturnType<typeof setInterval> | null = null
  let solutionGrid: number[][] = []

  function startGame(diff?: SudokuDifficulty): void {
    if (gameTimer !== null) clearInterval(gameTimer)

    if (diff) difficulty.value = diff
    mistakeCount.value = 0
    timer.value = 0
    isRunning.value = true
    isPaused.value = false
    isCompleted.value = false
    selectedRow.value = -1
    selectedCol.value = -1
    noteMode.value = false

    solutionGrid = generateSolution()
    board.value = createPuzzle(solutionGrid, difficulty.value)

    gameTimer = setInterval(() => {
      if (!isPaused.value) {
        timer.value++
      }
    }, 1000)
  }

  function endGame(): void {
    if (gameTimer !== null) clearInterval(gameTimer)
    gameTimer = null
  }

  function selectCell(row: number, col: number): void {
    if (!isRunning.value || isPaused.value || isCompleted.value) return
    if (board.value[row][col].isGiven) return
    selectedRow.value = row
    selectedCol.value = col
  }

  function inputNumber(num: number): void {
    if (!isRunning.value || isPaused.value || isCompleted.value) return
    if (selectedRow.value === -1 || selectedCol.value === -1) return

    const r = selectedRow.value
    const c = selectedCol.value
    const cell = board.value[r][c]
    if (cell.isGiven) return

    if (noteMode.value) {
      // 笔记模式
      const idx = cell.notes.indexOf(num)
      if (idx >= 0) {
        cell.notes.splice(idx, 1)
      } else {
        cell.notes.push(num)
        cell.notes.sort()
      }
      cell.value = 0
    } else {
      // 正常输入
      cell.notes = []
      cell.value = num
      if (num !== cell.solution) {
        cell.isError = true
        mistakeCount.value++
        if (mistakeCount.value >= 3) {
          // 错误超过3次，游戏失败
          isRunning.value = false
          endGame()
        }
      } else {
        cell.isError = false
        checkComplete()
      }
    }
  }

  function eraseCell(): void {
    if (!isRunning.value || isPaused.value || isCompleted.value) return
    if (selectedRow.value === -1 || selectedCol.value === -1) return

    const cell = board.value[selectedRow.value][selectedCol.value]
    if (cell.isGiven) return

    cell.value = 0
    cell.isError = false
    cell.notes = []
  }

  function checkComplete(): void {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board.value[r][c].value !== board.value[r][c].solution) return
      }
    }
    isCompleted.value = true
    isRunning.value = false
    endGame()

    // 更新最高分（用时越短越好）
    const key = `sudoku_${difficulty.value}`
    const prev = highScore.value[key]
    if (prev === undefined || timer.value < prev) {
      highScore.value = { ...highScore.value, [key]: timer.value }
      localStorage.setItem('sudoku_high_score', JSON.stringify(highScore.value))
    }
  }

  function getBestTime(): number | undefined {
    return highScore.value[`sudoku_${difficulty.value}`]
  }

  // 获取与选中格子相关的格子（同行、同列、同宫）
  function getRelatedCells(row: number, col: number): Set<string> {
    const related = new Set<string>()
    for (let i = 0; i < 9; i++) {
      related.add(`${row},${i}`)
      related.add(`${i},${col}`)
    }
    const boxRow = Math.floor(row / 3) * 3
    const boxCol = Math.floor(col / 3) * 3
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        related.add(`${r},${c}`)
      }
    }
    return related
  }

  function getCellClass(row: number, col: number): Record<string, boolean> {
    const cell = board.value[row]?.[col]
    if (!cell) return {}

    const isSelected = selectedRow.value === row && selectedCol.value === col
    const isSameNumber = !isSelected && cell.value !== 0 &&
      selectedRow.value >= 0 && selectedCol.value >= 0 &&
      board.value[selectedRow.value]?.[selectedCol.value]?.value === cell.value

    const selectedVal = selectedRow.value >= 0 && selectedCol.value >= 0
      ? board.value[selectedRow.value]?.[selectedCol.value]?.value
      : 0

    return {
      'cell-given': cell.isGiven,
      'cell-selected': isSelected,
      'cell-related': !isSelected && selectedRow.value >= 0 &&
        getRelatedCells(selectedRow.value, selectedCol.value).has(`${row},${col}`),
      'cell-same-number': isSameNumber && selectedVal > 0,
      'cell-error': cell.isError,
      'cell-note': cell.value === 0 && cell.notes.length > 0
    }
  }

  function getFormattedTime(): string {
    const m = Math.floor(timer.value / 60)
    const s = timer.value % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return {
    board,
    difficulty,
    selectedRow,
    selectedCol,
    isRunning,
    isPaused,
    isCompleted,
    noteMode,
    timer,
    mistakeCount,
    highScore,
    startGame,
    endGame,
    selectCell,
    inputNumber,
    eraseCell,
    getCellClass,
    getBestTime,
    getFormattedTime
  }
}
