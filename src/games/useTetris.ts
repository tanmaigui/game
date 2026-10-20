import { ref, computed, onUnmounted } from 'vue'
import type { TetrisCell, Piece, Position } from '@/types/game'

const COLS = 10
const ROWS = 20
const INITIAL_SPEED = 800

// 7种经典方块
const PIECES: Piece[] = [
  // I
  { shape: [[1, 1, 1, 1]], color: '#00f0f0' },
  // O
  { shape: [[1, 1], [1, 1]], color: '#f0f000' },
  // T
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0' },
  // S
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000' },
  // Z
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000' },
  // J
  { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000f0' },
  // L
  { shape: [[0, 0, 1], [1, 1, 1]], color: '#f0a000' }
]

export function useTetris() {
  const board = ref<TetrisCell[][]>([])
  const currentPiece = ref<Piece | null>(null)
  const currentPos = ref<Position>({ x: 0, y: 0 })
  const nextPiece = ref<Piece | null>(null)
  const score = ref(0)
  const lines = ref(0)
  const level = ref(1)
  const highScore = ref(Number(localStorage.getItem('tetris_high_score') || 0))
  const isRunning = ref(false)
  const isPaused = ref(false)
  const isGameOver = ref(false)

  let gameTimer: ReturnType<typeof setInterval> | null = null
  let speed = INITIAL_SPEED

  function initBoard(): void {
    board.value = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ filled: false, color: '' }))
    )
  }

  function getRandomPiece(): Piece {
    const idx = Math.floor(Math.random() * PIECES.length)
    return { ...PIECES[idx], shape: PIECES[idx].shape.map(r => [...r]) }
  }

  function spawnPiece(): void {
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

  function isValidPosition(shape: number[][], px: number, py: number): boolean {
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

  // 统一重建自动下落计时器（速度或节奏变化时调用）
  function restartTimer(): void {
    if (gameTimer !== null) clearInterval(gameTimer)
    gameTimer = null
    if (!isRunning.value || isPaused.value || isGameOver.value) return
    gameTimer = setInterval(() => moveDown(), speed)
  }

  function lockPiece(): void {
    const piece = currentPiece.value
    if (!piece) return
    const shape = piece.shape
    const { x, y } = currentPos.value
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue
        const by = y + r
        const bx = x + c
        if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
          board.value[by][bx] = { filled: true, color: piece.color }
        }
      }
    }
    clearLines()
    spawnPiece()
    // 新方块落地后重置下落节奏，避免刚生成就立刻下落
    restartTimer()
  }

  function clearLines(): void {
    const remaining = board.value.filter(row => !row.every(cell => cell.filled))
    const cleared = ROWS - remaining.length
    if (cleared === 0) return

    while (remaining.length < ROWS) {
      remaining.unshift(Array.from({ length: COLS }, () => ({ filled: false, color: '' })))
    }
    board.value = remaining

    const points = [0, 100, 300, 500, 800]
    score.value += points[cleared] * level.value
    lines.value += cleared
    level.value = Math.floor(lines.value / 10) + 1
    speed = Math.max(80, INITIAL_SPEED - (level.value - 1) * 70)
  }

  // 当前是否允许操作
  function canPlay(): boolean {
    return isRunning.value && !isPaused.value && !isGameOver.value && currentPiece.value !== null
  }

  function moveLeft(): void {
    if (!canPlay() || !currentPiece.value) return
    if (isValidPosition(currentPiece.value.shape, currentPos.value.x - 1, currentPos.value.y)) {
      currentPos.value = { ...currentPos.value, x: currentPos.value.x - 1 }
    }
  }

  function moveRight(): void {
    if (!canPlay() || !currentPiece.value) return
    if (isValidPosition(currentPiece.value.shape, currentPos.value.x + 1, currentPos.value.y)) {
      currentPos.value = { ...currentPos.value, x: currentPos.value.x + 1 }
    }
  }

  function moveDown(): void {
    if (!canPlay() || !currentPiece.value) return
    if (isValidPosition(currentPiece.value.shape, currentPos.value.x, currentPos.value.y + 1)) {
      currentPos.value = { ...currentPos.value, y: currentPos.value.y + 1 }
    } else {
      lockPiece()
    }
  }

  function hardDrop(): void {
    if (!canPlay() || !currentPiece.value) return
    let distance = 0
    while (isValidPosition(currentPiece.value.shape, currentPos.value.x, currentPos.value.y + 1)) {
      currentPos.value = { ...currentPos.value, y: currentPos.value.y + 1 }
      distance++
    }
    score.value += distance * 2
    lockPiece()
  }

  function rotate(): void {
    if (!canPlay() || !currentPiece.value) return
    const shape = currentPiece.value.shape
    const rotated: number[][] = shape[0].map((_, i) => shape.map(r => r[i]).reverse())
    const { x, y } = currentPos.value
    // 原地旋转失败时做 wall kick：先左右微调，再向上抬起（贴地/贴墙旋转）
    const kicks: [number, number][] = [
      [0, 0], [1, 0], [-1, 0], [2, 0], [-2, 0], [0, -1], [1, -1], [-1, -1]
    ]
    for (const [dx, dy] of kicks) {
      if (isValidPosition(rotated, x + dx, y + dy)) {
        currentPiece.value = { ...currentPiece.value, shape: rotated }
        currentPos.value = { x: x + dx, y: y + dy }
        return
      }
    }
  }

  function startGame(): void {
    if (gameTimer !== null) clearInterval(gameTimer)
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
    restartTimer()
  }

  function togglePause(): void {
    if (!isRunning.value || isGameOver.value) return
    isPaused.value = !isPaused.value
    restartTimer()
  }

  function endGame(): void {
    if (gameTimer !== null) clearInterval(gameTimer)
    isRunning.value = false
    isGameOver.value = true
    if (score.value > highScore.value) {
      highScore.value = score.value
      localStorage.setItem('tetris_high_score', String(score.value))
    }
  }

  // 硬降落点的 y 坐标（用于幽灵方块预览）
  const ghostY = computed<number>(() => {
    if (!currentPiece.value || !isRunning.value || isGameOver.value) return -1
    let gy = currentPos.value.y
    while (isValidPosition(currentPiece.value.shape, currentPos.value.x, gy + 1)) gy++
    return gy
  })

  const renderBoard = computed<TetrisCell[][]>(() => {
    const display = board.value.map(row => row.map(cell => ({ ...cell })))

    if (currentPiece.value && isRunning.value && !isGameOver.value) {
      const shape = currentPiece.value.shape
      const { x, y } = currentPos.value

      // 先画落点预览（幽灵方块）
      const gy = ghostY.value
      if (gy > y) {
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (!shape[r][c]) continue
            const by = gy + r
            const bx = x + c
            if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS && !display[by][bx].filled) {
              display[by][bx] = { filled: false, color: '', ghost: true }
            }
          }
        }
      }

      // 再画当前方块
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
  let touchOnControl = false // 是否触摸在操作按钮上

  function handleTouchStart(e: TouchEvent): void {
    const target = e.target as HTMLElement
    // 如果触摸点在操作按钮上，标记后跳过手势处理
    touchOnControl = target.closest('.controls') !== null
    if (touchOnControl) return
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
    touchStartTime = Date.now()
  }

  function handleTouchEnd(e: TouchEvent): void {
    if (touchOnControl) {
      touchOnControl = false
      return
    }
    const dx = e.changedTouches[0].clientX - touchStartX
    const dy = e.changedTouches[0].clientY - touchStartY
    const dt = Date.now() - touchStartTime
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx < 15 && absDy < 15 && dt < 200) {
      rotate()
      return
    }

    if (absDy > absDx && dy > 30) {
      hardDrop()
    } else if (absDx > absDy) {
      dx > 0 ? moveRight() : moveLeft()
    } else if (dy < -30) {
      rotate()
    }
  }

  initBoard()

  // 离开页面时清理定时器，避免游戏循环在后台继续运行
  onUnmounted(() => {
    if (gameTimer !== null) clearInterval(gameTimer)
    gameTimer = null
  })

  return {
    COLS,
    ROWS,
    board,
    renderBoard,
    ghostY,
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
