import { ref, computed } from 'vue'

const HOLE_COUNT = 9
const GAME_DURATION = 30 // 秒
const INITIAL_INTERVAL = 800 // ms
const MIN_INTERVAL = 400

export function useWhackAMole() {
  const holes = ref(Array.from({ length: HOLE_COUNT }, (_, i) => ({
    id: i,
    active: false,
    type: 'normal' // normal | golden | bomb
  })))
  const score = ref(0)
  const highScore = ref(Number(localStorage.getItem('mole_high_score') || 0))
  const timeLeft = ref(GAME_DURATION)
  const isRunning = ref(false)
  const isGameOver = ref(false)
  const lastHit = ref(-1)
  const combo = ref(0)

  let moleTimer = null
  let countdownTimer = null
  let currentInterval = INITIAL_INTERVAL

  function getRandomHole() {
    return Math.floor(Math.random() * HOLE_COUNT)
  }

  function getRandomType() {
    const r = Math.random()
    if (r < 0.1) return 'bomb'    // 10% 炸弹
    if (r < 0.25) return 'golden' // 15% 金色
    return 'normal'               // 75% 普通
  }

  function spawnMole() {
    // 先清除所有
    holes.value.forEach(h => h.active = false)
    
    // 随机 1~3 个洞出地鼠
    const count = Math.random() < 0.2 ? (Math.random() < 0.5 ? 3 : 2) : 1
    const used = new Set()
    
    for (let i = 0; i < count; i++) {
      let hole
      do { hole = getRandomHole() } while (used.has(hole))
      used.add(hole)
      holes.value[hole].active = true
      holes.value[hole].type = getRandomType()
    }
  }

  function startGame() {
    score.value = 0
    timeLeft.value = GAME_DURATION
    combo.value = 0
    lastHit.value = -1
    currentInterval = INITIAL_INTERVAL
    isRunning.value = true
    isGameOver.value = false
    holes.value.forEach(h => { h.active = false; h.type = 'normal' })
    
    spawnMole()
    moleTimer = setInterval(() => {
      spawnMole()
    }, currentInterval)

    countdownTimer = setInterval(() => {
      timeLeft.value--
      // 逐渐加速
      if (currentInterval > MIN_INTERVAL && timeLeft.value % 5 === 0) {
        currentInterval = Math.max(MIN_INTERVAL, currentInterval - 60)
        clearInterval(moleTimer)
        moleTimer = setInterval(() => spawnMole(), currentInterval)
      }
      if (timeLeft.value <= 0) {
        endGame()
      }
    }, 1000)
  }

  function hitHole(id) {
    if (!isRunning.value || isGameOver.value) return
    
    const hole = holes.value[id]
    if (!hole.active) {
      // 打空
      combo.value = 0
      return
    }

    switch (hole.type) {
      case 'normal':
        score.value += 10 + combo.value * 2
        break
      case 'golden':
        score.value += 30 + combo.value * 5
        break
      case 'bomb':
        score.value = Math.max(0, score.value - 20)
        combo.value = 0
        hole.active = false
        return
    }
    
    combo.value++
    lastHit.value = id
    hole.active = false

    // 打中后立即刷新一批
    clearInterval(moleTimer)
    spawnMole()
    moleTimer = setInterval(() => spawnMole(), currentInterval)
  }

  function endGame() {
    clearInterval(moleTimer)
    clearInterval(countdownTimer)
    isRunning.value = false
    isGameOver.value = true
    holes.value.forEach(h => h.active = false)
    if (score.value > highScore.value) {
      highScore.value = score.value
      localStorage.setItem('mole_high_score', String(score.value))
    }
  }

  const progressPercent = computed(() => (timeLeft.value / GAME_DURATION) * 100)

  return {
    holes,
    score,
    highScore,
    timeLeft,
    progressPercent,
    isRunning,
    isGameOver,
    combo,
    startGame,
    hitHole
  }
}
