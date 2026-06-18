import { ref, computed } from 'vue'

const COLS = 10
const ROWS = 20
const INITIAL_SPEED = 800

// 7种经典方块
const PIECES = [
  // I
  { shape: [[1,1,1,1]], color: '#00f0f0' },
  // O
  { shape: [[1,1],[1,1]], color: '#f0f000' },
  // T
  { shape: [[0,1,0],[1,1,1]], color: '#a000f0' },
  // S
  { shape: [[0,1,1],[1,1,0]], color: '#00f000' },
  // Z
  { shape: [[1,1,0],[0,1,1]], color: '#f00000' },
  // J
  { shape: [[1,0,0],[1,1,1]], color: '#0000f0' },
  // L
  { shape: [[0,0,1],[1,1,1]], color: '#f0a000' }
]

export function useTetris() {
  const board = ref([])
  const currentPiece = ref(null)
  const currentPos = ref({ x: 0, y: 0 })
  const nextPiece = ref(null)
  const score = ref(0)
  const lines = ref(0)
  const level = ref(1)
  const highScore = ref(Number(localStorage.getItem('tetris_high_score') || 0))
  const isRunning = ref(false)
  const isPaused = ref(false)
  const isGameOver = ref(false)

  let gameTimer = null
  let speed = INITIAL_SPEED

  function initBoard() {
    board.value = Array.from({ length: ROWS }, () => 
      Array.from({ length: COLS }, () => ({ filled: false, color: '' }))
    )
  }

  function getRandomPiece() {
    const idx = Math.floor(Math.random() * PIECES.length)
    return { ...PIECES[idx], shape: PIECES[idx].shape.map(r => [...r]) }
  }

  function spawnPiece() {
    const piece = nextPiece.value || getRandomPiece()
    nextPiece.value = getRandomPiece()
    currentPiece.value = piece
    currentPos.value = {
      x: Math.floor((COLS - piece.shape[0].length) / 2),
      y: 0
    }

    // 检查是否撞到
    if (!isValidPosition(piece.shape, currentPos.value.x, currentPos.value.y)) {
      endGame()
    }
  }

  function isValidPosition(shape, px, py) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue
        const bx = px + c
        const by = py + r
        if (bx < 0 || bx >= COLS || by >= ROWS) return false
        if (by < 0) continue
        if (board.value[by][bx].filled) return false
      }
    }
    return true
  }

  function lockPiece() {
    const shape = currentPiece.value.shape
    const { x, y } = currentPos.value
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue
        const by = y + r
        const bx = x + c
        if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
          board.value[by][bx] = { filled: true, color: currentPiece.value.color }
        }
      }
    }
    clearLines()
    spawnPiece()
  }

  function clearLines() {
    let cleared = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board.value[r].every(cell => cell.filled)) {
        board.value.splice(r, 1)
        board.value.unshift(Array.from({ length: COLS }, () => ({ filled: false, color: '' })))
        cleared++
        r++ // 重新检查当前行
      }
    }

    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800]
      score.value += points[cleared] * level.value
      lines.value += cleared
      level.value = Math.floor(lines.value / 10) + 1
      speed = Math.max(80, INITIAL_SPEED - (level.value - 1) * 70)
      clearInterval(gameTimer)
      gameTimer = setInterval(() => moveDown(), speed)
    }
  }

  function moveLeft() {
    if (!isRunning.value || isPaused.value || isGameOver.value) return
    if (isValidPosition(currentPiece.value.shape, currentPos.value.x - 1, currentPos.value.y)) {
      currentPos.value = { ...currentPos.value, x: currentPos.value.x - 1 }
    }
  }

  function moveRight() {
    if (!isRunning.value || isPaused.value || isGameOver.value) return
    if (isValidPosition(currentPiece.value.shape, currentPos.value.x + 1, currentPos.value.y)) {
      currentPos.value = { ...currentPos.value, x: currentPos.value.x + 1 }
    }
  }

  function moveDown() {
    if (!isRunning.value || isPaused.value || isGameOver.value) return
    if (isValidPosition(currentPiece.value.shape, currentPos.value.x, currentPos.value.y + 1)) {
      currentPos.value = { ...currentPos.value, y: currentPos.value.y + 1 }
    } else {
      lockPiece()
    }
  }

  function hardDrop() {
    if (!isRunning.value || isPaused.value || isGameOver.value) return
    while (isValidPosition(currentPiece.value.shape, currentPos.value.x, currentPos.value.y + 1)) {
      currentPos.value = { ...currentPos.value, y: currentPos.value.y + 1 }
      score.value += 2
    }
    lockPiece()
  }

  function rotate() {
    if (!isRunning.value || isPaused.value || isGameOver.value) return
    const shape = currentPiece.value.shape
    // 顺时针旋转
    const rotated = shape[0].map((_, i) => shape.map(r => r[i]).reverse())
    if (isValidPosition(rotated, currentPos.value.x, currentPos.value.y)) {
      currentPiece.value = { ...currentPiece.value, shape: rotated }
    } else {
      // 尝试左右偏移（wall kick）
      for (const offset of [1, -1, 2, -2]) {
        if (isValidPosition(rotated, currentPos.value.x + offset, currentPos.value.y)) {
          currentPiece.value = { ...currentPiece.value, shape: rotated }
          currentPos.value = { ...currentPos.value, x: currentPos.value.x + offset }
          return
        }
      }
    }
  }

  function startGame() {
    clearInterval(gameTimer)
    initBoard()
    score.value = 0
    lines.value = 0
    level.value = 1
    speed = INITIAL_SPEED
    isRunning.value = true
    isPaused.value = false
    isGameOver.value = false
    nextPiece.value = getRandomPiece()
    spawnPiece()
    gameTimer = setInterval(() => moveDown(), speed)
  }

  function togglePause() {
    if (!isRunning.value || isGameOver.value) return
    isPaused.value = !isPaused.value
    if (isPaused.value) {
      clearInterval(gameTimer)
    } else {
      gameTimer = setInterval(() => moveDown(), speed)
    }
  }

  function endGame() {
    clearInterval(gameTimer)
    isRunning.value = false
    isGameOver.value = true
    if (score.value > highScore.value) {
      highScore.value = score.value
      localStorage.setItem('tetris_high_score', String(score.value))
    }
  }

  // 获取需要渲染的格子（当前方块投影到棋盘上）
  const renderBoard = computed(() => {
    const display = board.value.map(row => row.map(cell => ({ ...cell })))
    
    if (currentPiece.value && isRunning.value && !isGameOver.value) {
      const shape = currentPiece.value.shape
      const { x, y } = currentPos.value
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue
          const by = y + r
          const bx = x + c
          if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
            display[by][bx] = { filled: true, color: currentPiece.value.color, active: true }
          }
        }
      }
    }
    return display
  })

  // 移动端手势
  let touchStartX = 0
  let touchStartY = 0
  let touchStartTime = 0

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
    touchStartTime = Date.now()
  }

  function handleTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX
    const dy = e.changedTouches[0].clientY - touchStartY
    const dt = Date.now() - touchStartTime
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx < 15 && absDy < 15 && dt < 200) {
      // 点击 = 旋转
      rotate()
      return
    }
    
    if (absDy > absDx && dy > 30) {
      // 下滑 = 硬降
      hardDrop()
    } else if (absDx > absDy) {
      dx > 0 ? moveRight() : moveLeft()
    } else if (dy < -30) {
      rotate()
    }
  }

  initBoard()

  return {
    board,
    renderBoard,
    currentPiece,
    nextPiece,
    score,
    lines,
    level,
    highScore,
    isRunning,
    isPaused,
    isGameOver,
    startGame,
    togglePause,
    moveLeft,
    moveRight,
    moveDown,
    hardDrop,
    rotate,
    handleTouchStart,
    handleTouchEnd
  }
}
