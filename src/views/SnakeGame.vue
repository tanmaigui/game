<template>
  <div class="snake-page" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <!-- 顶部导航 -->
    <header class="game-topbar">
      <button class="btn-back" @click="$router.push('/')">
        <span class="back-icon">←</span>
        <span class="back-text">返回</span>
      </button>
      <div class="score-area">
        <div class="score-item">
          <span class="label">分数</span>
          <span class="value">{{ score }}</span>
        </div>
        <div class="score-item">
          <span class="label">最高</span>
          <span class="value high">{{ highScore }}</span>
        </div>
      </div>
    </header>

    <!-- 游戏画布 -->
    <div class="game-board-wrapper">
      <div
        class="game-board"
        :style="{
          width: boardPixelSize + 'px',
          height: boardPixelSize + 'px'
        }"
      >
        <!-- 网格背景 -->
        <svg class="board-svg" :width="boardPixelSize" :height="boardPixelSize">
          <defs>
            <pattern id="grid" :width="cellSize" :height="cellSize" patternUnits="userSpaceOnUse">
              <path :d="`M ${cellSize} 0 L 0 0 0 ${cellSize}`" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <!-- 食物 -->
        <div
          class="food"
          :style="{
            left: food.x * cellSize + 'px',
            top: food.y * cellSize + 'px',
            width: cellSize + 'px',
            height: cellSize + 'px'
          }"
        >
          <span class="food-dot">🍎</span>
        </div>

        <!-- 蛇身 -->
        <div
          v-for="(seg, i) in snake"
          :key="i"
          class="snake-seg"
          :class="{ head: i === 0 }"
          :style="{
            left: seg.x * cellSize + 'px',
            top: seg.y * cellSize + 'px',
            width: cellSize + 'px',
            height: cellSize + 'px',
            '--seg-index': i
          }"
        />

        <!-- 开始遮罩 -->
        <div v-if="!isRunning && !isGameOver" class="overlay">
          <button class="btn-start" @click="startGame">
            <span class="btn-icon">▶</span>
            开始游戏
          </button>
          <p class="hint">使用方向键或滑动屏幕控制蛇的移动</p>
        </div>

        <!-- 暂停遮罩 -->
        <div v-if="isPaused" class="overlay">
          <div class="pause-text">已暂停</div>
          <button class="btn-start" @click="togglePause">
            <span class="btn-icon">▶</span>
            继续
          </button>
        </div>

        <!-- 结束遮罩 -->
        <div v-if="isGameOver" class="overlay gameover-overlay">
          <div class="gameover-text">游戏结束</div>
          <div class="gameover-score">得分：{{ score }}</div>
          <div v-if="score >= highScore && score > 0" class="new-record">🎉 新纪录！</div>
          <button class="btn-start" @click="startGame">
            <span class="btn-icon">🔄</span>
            再来一局
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端方向键 -->
    <div class="mobile-controls">
      <div class="dpad">
        <button class="dpad-btn up" @touchstart.prevent="changeDirection('UP')">
          <span>▲</span>
        </button>
        <button class="dpad-btn left" @touchstart.prevent="changeDirection('LEFT')">
          <span>◀</span>
        </button>
        <div class="dpad-center">
          <button class="dpad-btn pause-btn" @touchstart.prevent="togglePause">
            <span>{{ isPaused ? '▶' : '⏸' }}</span>
          </button>
        </div>
        <button class="dpad-btn right" @touchstart.prevent="changeDirection('RIGHT')">
          <span>▶</span>
        </button>
        <button class="dpad-btn down" @touchstart.prevent="changeDirection('DOWN')">
          <span>▼</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useSnakeGame } from '@/games/useSnakeGame'

const {
  snake,
  food,
  score,
  highScore,
  isRunning,
  isPaused,
  isGameOver,
  cellSize,
  boardWidth,
  startGame,
  togglePause,
  changeDirection,
  handleTouchStart,
  handleTouchEnd
} = useSnakeGame()

const boardPixelSize = computed(() => cellSize.value * boardWidth)

function onKeyDown(e: KeyboardEvent): void {
  const keyMap: Record<string, string> = {
    ArrowUp: 'UP',
    ArrowDown: 'DOWN',
    ArrowLeft: 'LEFT',
    ArrowRight: 'RIGHT',
    w: 'UP',
    s: 'DOWN',
    a: 'LEFT',
    d: 'RIGHT',
    W: 'UP',
    S: 'DOWN',
    A: 'LEFT',
    D: 'RIGHT'
  }
  const dir = keyMap[e.key]
  if (dir) {
    e.preventDefault()
    changeDirection(dir as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT')
  }
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault()
    togglePause()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.snake-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #0a0a18;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.game-topbar {
  width: 100%;
  max-width: 440px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  gap: 12px;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ccc;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-back:active {
  background: rgba(255, 255, 255, 0.12);
}

.back-icon {
  font-size: 16px;
}

.score-area {
  display: flex;
  gap: 16px;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-item .label {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.score-item .value {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.score-item .value.high {
  color: #ffd700;
  font-size: 16px;
}

.game-board-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
}

.game-board {
  position: relative;
  background: #111122;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 100, 255, 0.08), inset 0 0 30px rgba(0, 0, 0, 0.3);
}

.board-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.food {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.05s ease;
}

.food-dot {
  font-size: 80%;
  animation: foodPulse 0.6s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 4px rgba(255, 100, 50, 0.6));
}

@keyframes foodPulse {
  from { transform: scale(0.8); }
  to { transform: scale(1.05); }
}

.snake-seg {
  position: absolute;
  border-radius: 3px;
  background: rgba(76, 217, 100, calc(1 - var(--seg-index, 0) * 0.03));
  border: 1px solid rgba(76, 217, 100, 0.3);
  transition: all 0.05s linear;
  box-shadow: 0 0 4px rgba(76, 217, 100, 0.2);
}

.snake-seg.head {
  background: #4cd964;
  border-radius: 5px;
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 8px rgba(76, 217, 100, 0.5);
  z-index: 2;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 24, 0.85);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 10;
  gap: 14px;
}

.gameover-overlay {
  background: rgba(10, 10, 24, 0.9);
}

.pause-text,
.gameover-text {
  font-size: clamp(22px, 5vw, 28px);
  font-weight: 700;
  color: #fff;
}

.gameover-score {
  font-size: 18px;
  color: #ccc;
}

.new-record {
  font-size: 16px;
  color: #ffd700;
  animation: bounce 0.6s ease infinite alternate;
}

@keyframes bounce {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}

.btn-start {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  background: linear-gradient(135deg, #4cd964, #34c759);
  color: #fff;
  border: none;
  border-radius: 25px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(76, 217, 100, 0.3);
}

.btn-start:active {
  transform: scale(0.95);
}

.btn-icon {
  font-size: 16px;
}

.hint {
  font-size: 12px;
  color: #666;
  text-align: center;
  max-width: 200px;
  line-height: 1.5;
}

.mobile-controls {
  padding: 12px 0;
  padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
}

.dpad {
  display: grid;
  grid-template-columns: 60px 60px 60px;
  grid-template-rows: 60px 60px 60px;
  gap: 4px;
}

.dpad-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #aaa;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.1s;
  -webkit-tap-highlight-color: transparent;
}

.dpad-btn:active {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  transform: scale(0.92);
}

.dpad-btn.up { grid-column: 2; grid-row: 1; }
.dpad-btn.left { grid-column: 1; grid-row: 2; }
.dpad-center { grid-column: 2; grid-row: 2; display: flex; align-items: center; justify-content: center; }
.dpad-btn.right { grid-column: 3; grid-row: 2; }
.dpad-btn.down { grid-column: 2; grid-row: 3; }

.pause-btn {
  width: 100%;
  height: 100%;
  font-size: 16px;
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.2);
}

@media (min-width: 769px) {
  .mobile-controls {
    display: none;
  }

  .game-board-wrapper {
    padding-bottom: 20px;
  }
}
</style>
