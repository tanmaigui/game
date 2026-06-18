import { ref, computed, reactive } from 'vue'

// 初级: 9x9, 10个雷
// 中级: 16x16, 40个雷  
// 移动端用 8x8 10雷，PC端用 9x9 10雷
const LEVELS = {
  easy: { rows: 9, cols: 9, mines: 10 },
  mobile: { rows: 8, cols: 8, mines: 10 }
}

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

export function useMinesweeper() {
  const level = computed(() => isMobile() ? LEVELS.mobile : LEVELS.easy)
  const board = ref([])
  const revealed = ref(new Set())
  const flagged = ref(new Set())
  const gameStatus = ref('idle') // idle | playing | won | lost
  const mineCount = ref(level.value.mines)
  const flagCount = ref(0)
  const timer = ref(0)
  const highScore = ref(Number(localStorage.getItem('minesweeper_high_score') || 0))

  let gameTimer = null
  let minePositions = new Set()

  function initBoard() {
    const { rows, cols } = level.value
    board.value = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        row: r,
        col: c,
        mine: false,
        adjacentMines: 0
      }))
    )
    revealed.value = new Set()
    flagged.value = new Set()
    minePositions = new Set()
    gameStatus.value = 'idle'
    flagCount.value = 0
    timer.value = 0
    clearInterval(gameTimer)
  }

  function placeMines(excludeRow, excludeCol) {
    const { rows, cols, mines } = level.value
    const positions = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1) continue
        positions.push({ r, c })
      }
    }

    // 随机选 mines 个位置
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]]
    }

    minePositions = new Set()
    const selected = positions.slice(0, mines)
    selected.forEach(({ r, c }) => {
      board.value[r][c].mine = true
      minePositions.add(`${r},${c}`)
    })

    // 计算每个格子的相邻雷数
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!board.value[r][c].mine) {
          board.value[r][c].adjacentMines = countAdjacentMines(r, c)
        }
      }
    }

    mineCount.value = mines
  }

  function countAdjacentMines(row, col) {
    const { rows, cols } = level.value
    let count = 0
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const nr = row + dr
        const nc = col + dc
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (board.value[nr][nc].mine) count++
        }
      }
    }
    return count
  }

  function reveal(row, col) {
    if (gameStatus.value === 'lost' || gameStatus.value === 'won') return
    
    const key = `${row},${col}`
    if (revealed.value.has(key) || flagged.value.has(key)) return

    if (gameStatus.value === 'idle') {
      placeMines(row, col)
      gameStatus.value = 'playing'
      startTimer()
    }

    const cell = board.value[row][col]
    
    if (cell.mine) {
      // 踩雷了
      revealAllMines()
      gameStatus.value = 'lost'
      clearInterval(gameTimer)
      return
    }

    revealed.value.add(key)

    // 如果是空格（无相邻雷），自动展开
    if (cell.adjacentMines === 0) {
      const { rows, cols } = level.value
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr
          const nc = col + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            reveal(nr, nc)
          }
        }
      }
    }

    checkWin()
  }

  function toggleFlag(row, col) {
    if (gameStatus.value !== 'playing' && gameStatus.value !== 'idle') return
    const key = `${row},${col}`
    if (revealed.value.has(key)) return

    if (flagged.value.has(key)) {
      flagged.value.delete(key)
      flagCount.value--
    } else {
      if (flagCount.value >= mineCount.value) return
      flagged.value.add(key)
      flagCount.value++
    }
  }

  function revealAllMines() {
    const { rows, cols } = level.value
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board.value[r][c].mine) {
          revealed.value.add(`${r},${c}`)
        }
      }
    }
  }

  function checkWin() {
    const { rows, cols } = level.value
    let allRevealed = true
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!board.value[r][c].mine && !revealed.value.has(`${r},${c}`)) {
          allRevealed = false
          break
        }
      }
      if (!allRevealed) break
    }
    if (allRevealed) {
      gameStatus.value = 'won'
      clearInterval(gameTimer)
      if (timer.value < highScore.value || highScore.value === 0) {
        highScore.value = timer.value
        localStorage.setItem('minesweeper_high_score', String(timer.value))
      }
    }
  }

  function startTimer() {
    clearInterval(gameTimer)
    timer.value = 0
    gameTimer = setInterval(() => {
      timer.value++
    }, 1000)
  }

  function startGame() {
    clearInterval(gameTimer)
    initBoard()
  }

  function getCellStyle(row, col) {
    const key = `${row},${col}`
    const cell = board.value[row]?.[col]
    if (!cell) return {}
    if (!revealed.value.has(key)) return {}
    
    if (cell.mine) return { color: '#ff4444' }
    const colors = ['', '#3498db', '#2ecc71', '#e74c3c', '#8e44ad', '#f39c12', '#1abc9c', '#e67e22', '#95a5a6']
    return { color: colors[cell.adjacentMines] || '#fff' }
  }

  const remainingMines = computed(() => mineCount.value - flagCount.value)

  // 移动端长按标记
  let longPressTimer = null
  function handleCellPointerDown(row, col) {
    longPressTimer = setTimeout(() => {
      toggleFlag(row, col)
    }, 500)
  }

  function handleCellPointerUp(row, col) {
    clearTimeout(longPressTimer)
  }

  function handleCellClick(row, col) {
    if (isMobile()) {
      // 移动端：点击 = 翻开，长按 = 标记
      reveal(row, col)
    } else {
      reveal(row, col)
    }
  }

  function handleCellRightClick(row, col) {
    toggleFlag(row, col)
  }

  initBoard()

  return {
    board,
    revealed,
    flagged,
    gameStatus,
    timer,
    highScore,
    flagCount,
    remainingMines,
    mineCount,
    level,
    startGame,
    reveal,
    toggleFlag,
    getCellStyle,
    handleCellClick,
    handleCellRightClick,
    handleCellPointerDown,
    handleCellPointerUp
  }
}
