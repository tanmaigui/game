<template>
  <div class="minesweeper-page">
    <!-- 顶部栏 -->
    <header class="game-topbar">
      <button class="btn-back" @click="$router.push('/')">
        <span class="back-icon">←</span>
        <span class="back-text">返回</span>
      </button>
      <div class="score-area">
        <div class="score-item">
          <span class="label">💣</span>
          <span class="value">{{ remainingMines }}</span>
        </div>
        <div class="score-item">
          <span class="label">⏱</span>
          <span class="value timer">{{ timer }}s</span>
        </div>
        <div class="score-item">
          <span class="label">🏆</span>
          <span class="value high">{{ highScore || '-' }}s</span>
        </div>
      </div>
    </header>

    <!-- 状态指示 -->
    <div class="status-bar" v-if="gameStatus !== 'idle'">
      <span class="status-text" :class="gameStatus">
        {{ statusText }}
      </span>
    </div>

    <!-- 游戏棋盘 -->
    <div class="board-wrapper">
      <div
        class="board"
        :style="{ 
          '--cols': level.cols, 
          '--rows': level.rows,
          fontSize: boardFontSize + 'px'
        }"
      >
        <template v-for="(row, r) in board" :key="r">
          <div
            v-for="(cell, c) in row"
            :key="`${r},${c}`"
            class="cell"
            :class="{
              revealed: revealed.has(`${r},${c}`),
              flagged: flagged.has(`${r},${c}`),
              mine: revealed.has(`${r},${c}`) && cell.mine,
              'game-over-mine': gameStatus === 'lost' && cell.mine && !flagged.has(`${r},${c}`),
              'wrong-flag': gameStatus === 'lost' && flagged.has(`${r},${c}`) && !cell.mine
            }"
            :style="getCellStyle(r, c)"
            @click="handleCellClick(r, c)"
            @contextmenu.prevent="handleCellRightClick(r, c)"
            @pointerdown="handleCellPointerDown(r, c)"
            @pointerup="handleCellPointerUp(r, c)"
            @pointerleave="handleCellPointerUp(r, c)"
          >
            <template v-if="revealed.has(`${r},${c}`)">
              <span v-if="cell.mine">💣</span>
              <span v-else-if="cell.adjacentMines > 0">{{ cell.adjacentMines }}</span>
            </template>
            <template v-else-if="flagged.has(`${r},${c}`)">
              <span class="flag">🚩</span>
            </template>
          </div>
        </template>
      </div>
    </div>

    <!-- 开始/结束 -->
    <div class="overlay-bottom" v-if="gameStatus === 'idle' || gameStatus === 'lost' || gameStatus === 'won'">
      <template v-if="gameStatus === 'idle'">
        <div class="overlay-content">
          <div class="game-icon-large">💣</div>
          <h2>扫雷</h2>
          <p class="hint">左键翻开 / 右键标记</p>
          <p class="hint hint-mobile">移动端：点击翻开 / 长按标记</p>
          <button class="btn-start" @click="startGame">
            <span>▶</span> 开始游戏
          </button>
        </div>
      </template>
      <template v-if="gameStatus === 'lost'">
        <div class="overlay-content gameover-overlay">
          <div class="gameover-text">💥 踩到雷了！</div>
          <button class="btn-start" @click="startGame">
            <span>🔄</span> 再来一局
          </button>
        </div>
      </template>
      <template v-if="gameStatus === 'won'">
        <div class="overlay-content gameover-overlay win-overlay">
          <div class="gameover-text">🎉 你赢了！</div>
          <div class="gameover-score">用时：{{ timer }}秒</div>
          <div v-if="timer <= highScore && timer > 0" class="new-record">🏆 新纪录！</div>
          <button class="btn-start" @click="startGame">
            <span>🔄</span> 再来一局
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMinesweeper } from '@/games/useMinesweeper'

const {
  board, revealed, flagged, gameStatus, timer, highScore,
  remainingMines, level, startGame,
  getCellStyle, handleCellClick, handleCellRightClick,
  handleCellPointerDown, handleCellPointerUp
} = useMinesweeper()

const statusText = computed(() => {
  switch (gameStatus.value) {
    case 'playing': return '游戏中'
    case 'won': return '🎉 你赢了！'
    case 'lost': return '💥 踩雷了'
    default: return ''
  }
})

const boardFontSize = computed(() => {
  if (typeof window !== 'undefined') {
    const maxW = Math.min(window.innerWidth - 20, 400)
    const maxH = Math.min(window.innerHeight - 200, 400)
    const size = Math.floor(Math.min(maxW / level.value.cols, maxH / level.value.rows))
    return Math.max(10, Math.min(size * 0.6, 22))
  }
  return 16
})
</script>

<style scoped>
.minesweeper-page {
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
  gap: 8px;
}

.btn-back {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: #ccc; padding: 6px 14px; border-radius: 8px;
  cursor: pointer; font-size: 14px;
}
.btn-back:active { background: rgba(255,255,255,0.12); }

.score-area { display: flex; gap: 20px; }
.score-item { display: flex; flex-direction: column; align-items: center; }
.score-item .label { font-size: 14px; }
.score-item .value { font-size: 20px; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; }
.score-item .value.timer { color: #4cd964; }
.score-item .value.high { color: #ffd700; font-size: 15px; }

.status-bar { padding: 4px 0; }
.status-text { font-size: 13px; color: #888; }
.status-text.won { color: #4cd964; }
.status-text.lost { color: #ff4444; }

.board-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
}

.board {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: 1px;
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 1px;
}

.cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.85em;
  border-radius: 2px;
  transition: background 0.1s;
  min-width: 28px;
  min-height: 28px;
  -webkit-tap-highlight-color: transparent;
}

.cell:active:not(.revealed) {
  background: #2a2a4e;
}

.cell.revealed {
  background: #141428;
  cursor: default;
}

.cell.flagged {
  background: #1a2a1e;
}

.cell.mine {
  background: #3a1010 !important;
}

.cell.game-over-mine {
  background: #4a1010 !important;
  animation: mineFlash 0.3s ease;
}

.cell.wrong-flag {
  background: #2a1a10 !important;
  text-decoration: line-through;
}

@keyframes mineFlash {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.flag {
  font-size: 0.8em;
  animation: flagPop 0.15s ease;
}

@keyframes flagPop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.overlay-bottom {
  padding: 16px 20px;
  padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
}

.overlay-content {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; text-align: center;
}
.game-icon-large { font-size: 40px; }
.overlay-content h2 { font-size: 20px; color: #fff; }
.hint { font-size: 13px; color: #888; }
.hint-mobile { font-size: 11px; color: #666; }
.gameover-overlay { gap: 12px; }
.win-overlay { gap: 12px; }
.gameover-text { font-size: 22px; font-weight: 700; color: #fff; }
.gameover-score { font-size: 17px; color: #ccc; }
.new-record { font-size: 15px; color: #ffd700; animation: bounce 0.6s infinite alternate; }
@keyframes bounce { from { transform: scale(1); } to { transform: scale(1.1); } }

.btn-start {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 32px;
  background: linear-gradient(135deg, #5856d6, #4844aa);
  color: #fff; border: none; border-radius: 25px;
  font-size: 17px; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 15px rgba(88,86,214,0.3);
}
.btn-start:active { transform: scale(0.95); }
</style>
