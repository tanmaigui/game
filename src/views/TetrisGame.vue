<template>
  <div class="tetris-page" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <!-- 顶部栏 -->
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
          <span class="label">等级</span>
          <span class="value level">{{ level }}</span>
        </div>
        <div class="score-item">
          <span class="label">最高</span>
          <span class="value high">{{ highScore }}</span>
        </div>
      </div>
    </header>

    <!-- 游戏区域 -->
    <div class="game-main">
      <!-- 棋盘 -->
      <div class="board" :style="{ '--cols': COLS, '--rows': ROWS, '--cell-size': cellSize + 'px' }">
        <div
          v-for="(cell, i) in flatBoard"
          :key="i"
          class="cell"
          :class="{ filled: cell.filled, active: cell.active, ghost: cell.ghost }"
          :style="cell.filled ? { background: cell.color } : {}"
        />
      </div>

      <!-- 侧边栏：下一个方块 + 信息 -->
      <div class="side-panel">
        <div class="next-piece-box">
          <div class="next-label">下一个</div>
          <div class="next-piece" v-if="nextPiece">
            <div
              v-for="(row, r) in nextPiece.shape"
              :key="r"
              class="next-row"
            >
              <div
                v-for="(val, c) in row"
                :key="c"
                class="next-cell"
                :style="val ? { background: nextPiece.color } : {}"
              />
            </div>
          </div>
        </div>

        <div class="lines-box">
          <div class="lines-label">消行</div>
          <div class="lines-value">{{ lines }}</div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="controls">
      <div class="ctrl-row">
        <button class="ctrl-btn" @click="moveLeft" @touchstart.prevent="moveLeft">
          <span>◀</span>
        </button>
        <button class="ctrl-btn down-btn" @click="moveDown" @touchstart.prevent="moveDown">
          <span>▼</span>
        </button>
        <button class="ctrl-btn" @click="moveRight" @touchstart.prevent="moveRight">
          <span>▶</span>
        </button>
      </div>
      <div class="ctrl-row">
        <button class="ctrl-btn rotate-btn" @click="rotate" @touchstart.prevent="rotate">
          <span>↻</span>
        </button>
        <button class="ctrl-btn drop-btn" @click="hardDrop" @touchstart.prevent="hardDrop">
          <span>⏬</span>
        </button>
        <button class="ctrl-btn pause-btn" @click="togglePause" @touchstart.prevent="togglePause">
          <span>{{ isPaused ? '▶' : '⏸' }}</span>
        </button>
      </div>
    </div>

    <!-- 开始遮罩 -->
    <div class="board-overlay" v-if="!isRunning && !isGameOver">
      <div class="overlay-inner">
        <div class="game-icon-large">🧩</div>
        <h2>俄罗斯方块</h2>
        <p class="hint">键盘：← → 移动，↑ 旋转，↓ 加速，空格 硬降</p>
        <p class="hint hint-mobile">触屏：点击旋转，滑动移动，下滑硬降</p>
        <button class="btn-start" @click="startGame">
          <span>▶</span> 开始游戏
        </button>
      </div>
    </div>

    <!-- 暂停遮罩 -->
    <div class="board-overlay" v-if="isPaused">
      <div class="overlay-inner">
        <div class="gameover-text">已暂停</div>
        <button class="btn-start" @click="togglePause">
          <span>▶</span> 继续
        </button>
      </div>
    </div>

    <!-- 结束遮罩 -->
    <div class="board-overlay" v-if="isGameOver">
      <div class="overlay-inner gameover-overlay">
        <div class="gameover-text">游戏结束</div>
        <div class="gameover-score">得分：{{ score }}</div>
        <div v-if="score >= highScore && score > 0" class="new-record">🎉 新纪录！</div>
        <button class="btn-start" @click="startGame">
          <span>🔄</span> 再来一局
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useTetris } from '@/games/useTetris'

const {
  COLS, ROWS, renderBoard, nextPiece, score, lines, level, highScore,
  isRunning, isPaused, isGameOver,
  startGame, togglePause, moveLeft, moveRight, moveDown,
  hardDrop, rotate, handleTouchStart, handleTouchEnd
} = useTetris()

const flatBoard = computed(() => renderBoard.value.flat())

// 监听窗口尺寸变化，让棋盘随屏幕自适应
const winSize = ref({ w: window.innerWidth, h: window.innerHeight })
function onResize(): void {
  winSize.value = { w: window.innerWidth, h: window.innerHeight }
}

// 桌面端（>=769px）隐藏底部操作栏，垂直空间更充裕
const isDesktop = computed(() => winSize.value.w >= 769)

// 计算格子边长：同时受可用高度和可用宽度约束，保证 10x20 棋盘完整可见
const cellSize = computed(() => {
  // 顶部栏 + 操作区需预留的垂直高度
  // 移动端操作区为两行按钮（约150px），另留约50px 底部留白，避免按钮贴到屏幕底边
  const reserveH = isDesktop.value ? 90 : 250
  const reserveW = 110 // 侧边栏 + 间距
  const byHeight = (winSize.value.h - reserveH) / ROWS
  const byWidth = (winSize.value.w - reserveW) / COLS
  const size = Math.floor(Math.min(byHeight, byWidth))
  return Math.max(10, Math.min(size, 30))
})

function onKeyDown(e: KeyboardEvent): void {
  if (!isRunning.value) return
  switch (e.key) {
    case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); moveLeft(); break
    case 'ArrowRight': case 'd': case 'D': e.preventDefault(); moveRight(); break
    case 'ArrowDown': case 's': case 'S': e.preventDefault(); moveDown(); break
    case 'ArrowUp': case 'w': case 'W': e.preventDefault(); rotate(); break
    case ' ':
      e.preventDefault()
      if (!e.repeat) hardDrop() // 长按空格不连续硬降
      break
    case 'p': case 'P': case 'Escape':
      e.preventDefault()
      if (!e.repeat) togglePause()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.tetris-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #0a0a18;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  position: relative;
}

.game-topbar {
  width: 100%;
  max-width: 440px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  gap: 8px;
}

.btn-back {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: #ccc; padding: 6px 14px; border-radius: 8px;
  cursor: pointer; font-size: 14px;
}
.btn-back:active { background: rgba(255,255,255,0.12); }

.score-area { display: flex; gap: 14px; }
.score-item { display: flex; flex-direction: column; align-items: center; }
.score-item .label { font-size: 10px; color: #666; letter-spacing: 1px; }
.score-item .value { font-size: 20px; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; }
.score-item .value.level { color: #4cd964; }
.score-item .value.high { color: #ffd700; font-size: 14px; }

.game-main {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 0 10px;
}

.board {
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--cell-size));
  grid-template-rows: repeat(var(--rows), var(--cell-size));
  gap: 1px;
  background: rgba(255,255,255,0.03);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  padding: 1px;
  flex-shrink: 0;
}

.cell {
  width: var(--cell-size);
  height: var(--cell-size);
  background: #0d0d1f;
  border-radius: 1px;
  box-sizing: border-box;
}

.cell.filled {
  border-radius: 2px;
  border: 1px solid rgba(255,255,255,0.15);
}

.cell.active {
  border-color: rgba(255,255,255,0.3);
}

/* 落点预览 */
.cell.ghost {
  background: rgba(255,255,255,0.06);
  border: 1px dashed rgba(255,255,255,0.22);
  border-radius: 2px;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.next-piece-box, .lines-box {
  background: #111122;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 8px 10px;
  text-align: center;
}

.next-label, .lines-label {
  font-size: 10px;
  color: #666;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.lines-value {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.next-piece {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.next-row {
  display: flex;
  gap: 2px;
}

.next-cell {
  width: 14px;
  height: 14px;
  background: transparent;
  border-radius: 2px;
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
}

.ctrl-row {
  display: flex;
  gap: 14px;
}

.ctrl-btn {
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 16px;
  color: #ccc;
  font-size: 24px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.ctrl-btn:active {
  background: rgba(255,255,255,0.18);
  transform: scale(0.92);
}

.rotate-btn { color: #0a84ff; }
.down-btn { color: #4cd964; }
.drop-btn { color: #ff9500; }
.pause-btn { color: #ffd700; }

@media (min-width: 769px) {
  .controls { display: none; }
}

.board-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10,10,24,0.9);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 20;
}

.overlay-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  max-width: 300px;
}

.game-icon-large { font-size: 48px; }
.overlay-inner h2 { font-size: 22px; color: #fff; }
.hint { font-size: 12px; color: #888; line-height: 1.5; }
.hint-mobile { font-size: 11px; color: #666; }
.gameover-overlay { gap: 14px; }
.gameover-text { font-size: 24px; font-weight: 700; color: #fff; }
.gameover-score { font-size: 18px; color: #ccc; }
.new-record { font-size: 15px; color: #ffd700; animation: bounce 0.6s infinite alternate; }
@keyframes bounce { from { transform: scale(1); } to { transform: scale(1.1); } }

.btn-start {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 32px;
  background: linear-gradient(135deg, #0a84ff, #0066cc);
  color: #fff; border: none; border-radius: 25px;
  font-size: 17px; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 15px rgba(10,132,255,0.3);
}
.btn-start:active { transform: scale(0.95); }
</style>
