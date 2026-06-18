import { ref, computed } from 'vue'

const GRID_SIZE = 20
const CELL_SIZE = 16 // 默认格子像素大小，实际会根据屏幕动态计算
const INITIAL_SPEED = 150 // ms

export function useSnakeGame() {
  const snake = ref([{ x: 10, y: 10 }])
  const food = ref({ x: 15, y: 10 })
  const direction = ref('RIGHT')
  const nextDirection = ref('RIGHT')
  const score = ref(0)
  const highScore = ref(Number(localStorage.getItem('snake_high_score') || 0))
  const isRunning = ref(false)
  const isPaused = ref(false)
  const isGameOver = ref(false)
  const boardWidth = GRID_SIZE
  const boardHeight = GRID_SIZE

  let gameTimer = null
  let speed = INITIAL_SPEED

  // 方向向量
  const dirVectors = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
  }

  // 计算实际 cell 大小
  const cellSize = computed(() => {
    // 移动端和PC端自适应
    if (typeof window !== 'undefined') {
      const maxW = Math.min(window.innerWidth - 20, 400)
      const maxH = Math.min(window.innerHeight - 180, 400)
      const size = Math.floor(Math.min(maxW, maxH) / GRID_SIZE)
      return Math.max(10, size)
    }
    return CELL_SIZE
  })

  // 随机生成食物位置
  function generateFood() {
    let pos
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (snake.value.some(seg => seg.x === pos.x && seg.y === pos.y))
    food.value = pos
  }

  // 开始游戏
  function startGame() {
    snake.value = [{ x: 10, y: 10 }]
    direction.value = 'RIGHT'
    nextDirection.value = 'RIGHT'
    score.value = 0
    speed = INITIAL_SPEED
    isRunning.value = true
    isPaused.value = false
    isGameOver.value = false
    generateFood()
    startLoop()
  }

  // 暂停/继续
  function togglePause() {
    if (!isRunning.value || isGameOver.value) return
    isPaused.value = !isPaused.value
    if (isPaused.value) {
      clearInterval(gameTimer)
    } else {
      startLoop()
    }
  }

  // 游戏循环
  function startLoop() {
    clearInterval(gameTimer)
    gameTimer = setInterval(() => {
      moveSnake()
    }, speed)
  }

  // 移动蛇
  function moveSnake() {
    direction.value = nextDirection.value
    const head = snake.value[0]
    const vec = dirVectors[direction.value]
    const newHead = { x: head.x + vec.x, y: head.y + vec.y }

    // 碰墙检测
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      endGame()
      return
    }

    // 碰自己检测
    if (snake.value.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      endGame()
      return
    }

    // 吃到食物
    if (newHead.x === food.value.x && newHead.y === food.value.y) {
      snake.value = [newHead, ...snake.value]
      score.value += 10
      generateFood()
      // 加速
      if (speed > 60) {
        speed -= 3
        startLoop()
      }
    } else {
      snake.value = [newHead, ...snake.value.slice(0, -1)]
    }
  }

  // 结束游戏
  function endGame() {
    clearInterval(gameTimer)
    isRunning.value = false
    isGameOver.value = true
    if (score.value > highScore.value) {
      highScore.value = score.value
      localStorage.setItem('snake_high_score', String(score.value))
    }
  }

  // 改变方向
  function changeDirection(dir) {
    const opposites = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
    if (opposites[dir] !== direction.value) {
      nextDirection.value = dir
    }
  }

  // 移动端手势处理
  let touchStartX = 0
  let touchStartY = 0

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
  }

  function handleTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX
    const dy = e.changedTouches[0].clientY - touchStartY
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx < 20 && absDy < 20) return // 太小忽略

    if (absDx > absDy) {
      changeDirection(dx > 0 ? 'RIGHT' : 'LEFT')
    } else {
      changeDirection(dy > 0 ? 'DOWN' : 'UP')
    }
  }

  return {
    snake,
    food,
    direction,
    score,
    highScore,
    isRunning,
    isPaused,
    isGameOver,
    boardWidth,
    boardHeight,
    cellSize,
    startGame,
    togglePause,
    changeDirection,
    handleTouchStart,
    handleTouchEnd
  }
}
