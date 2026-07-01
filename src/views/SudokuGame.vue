<template>
  <div class="sudoku-page">
    <!-- 顶部栏 -->
    <header class="game-topbar">
      <button class="btn-back" @click="$router.push('/')">
        <span class="back-icon">←</span>
        <span class="back-text">返回</span>
      </button>
      <div class="score-area">
        <div class="score-item">
          <span class="label">⏱</span>
          <span class="value timer">{{ getFormattedTime() }}</span>
        </div>
        <div class="score-item">
          <span class="label">❌</span>
          <span class="value mistakes" :class="{ 'max-mistakes': mistakeCount >= 3 }">
            {{ mistakeCount }}/3
          </span>
        </div>
        <div class="score-item">
          <span class="label">🏆</span>
          <span class="value high">{{ bestTime || '-' }}</span>
        </div>
      </div>
    </header>

    <!-- 难度选择 -->
    <div class="difficulty-bar" v-if="!isRunning || isPaused">
      <button
        v-for="d in difficulties"
        :key="d.value"
        class="btn-diff"
        :class="{ active: difficulty === d.value }"
        @click="difficulty = d.value as SudokuDifficulty"
      >
        {{ d.label }}
      </button>
    </div>

    <!-- 棋盘 -->
    <div class="board-wrapper">
      <div class="board">
        <template v-for="(row, r) in board" :key="r">
          <div
            v-for="(cell, c) in row"
            :key="`${r},${c}`"
            class="cell"
            :class="getCellClass(r, c)"
            @click="selectCell(r, c)"
          >
            <span v-if="cell.value > 0" class="cell-value">{{ cell.value }}</span>
            <span v-else-if="cell.notes.length > 0" class="cell-notes">
              <span
                v-for="n in 9"
                :key="n"
                class="note-num"
                :class="{ visible: cell.notes.includes(n) }"
              >{{ n }}</span>
            </span>
          </div>
        </template>
      </div>
    </div>

    <!-- 数字键盘 -->
    <div class="numpad" v-if="isRunning && !isPaused && !isCompleted">
      <button
        v-for="n in 9"
        :key="n"
        class="btn-num"
        :class="{ 'has-count': getRemainingCount(n) <= 0 }"
        @click="inputNumber(n)"
      >
        {{ n }}
        <span class="num-count" v-if="getRemainingCount(n) >= 0">{{ getRemainingCount(n) }}</span>
      </button>
      <button class="btn-num btn-note" :class="{ active: noteMode }" @click="noteMode = !noteMode">
        ✏️
      </button>
      <button class="btn-num btn-erase" @click="eraseCell">⌫</button>
    </div>

    <!-- 覆盖层 -->
    <div class="overlay-bottom" v-if="!isRunning || isPaused || isCompleted">
      <template v-if="!isRunning && !isCompleted && !isPaused">
        <!-- 初始状态 -->
        <div class="overlay-content">
          <div class="game-icon-large">🧩</div>
          <h2>数独</h2>
          <p class="hint">点击格子后输入数字，✏️切换笔记模式</p>
          <button class="btn-start" @click="startGame(difficulty)">
            <span>▶</span> 开始游戏
          </button>
        </div>
      </template>

      <template v-if="isPaused">
        <div class="overlay-content">
          <h2>⏸️ 已暂停</h2>
          <button class="btn-start" @click="isPaused = false">
            <span>▶</span> 继续游戏
          </button>
        </div>
      </template>

      <template v-if="isCompleted">
        <div class="overlay-content gameover-overlay win-overlay">
          <div class="gameover-text">🎉 恭喜完成！</div>
          <div class="gameover-score">用时：{{ getFormattedTime() }}</div>
          <div v-if="isNewRecord" class="new-record">🏆 新纪录！</div>
          <button class="btn-start" @click="startGame(difficulty)">
            <span>🔄</span> 再来一局
          </button>
          <button class="btn-start btn-secondary" @click="endGame()">
            <span>🏠</span> 换难度
          </button>
        </div>
      </template>

      <template v-if="!isRunning && !isPaused && mistakeCount >= 3">
        <div class="overlay-content gameover-overlay">
          <div class="gameover-text">😞 错误太多了</div>
          <div class="gameover-score">最多允许3次错误</div>
          <button class="btn-start" @click="startGame(difficulty)">
            <span>🔄</span> 再来一局
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSudoku } from '@/games/useSudoku'
import type { SudokuDifficulty } from '@/types/game'

const difficulties = [
  { value: 'easy' as SudokuDifficulty, label: '简单' },
  { value: 'medium' as SudokuDifficulty, label: '中等' },
  { value: 'hard' as SudokuDifficulty, label: '困难' }
]

const {
  board, difficulty, selectedRow, selectedCol,
  isRunning, isPaused, isCompleted, noteMode,
  timer, mistakeCount,
  startGame, endGame, selectCell, inputNumber, eraseCell,
  getCellClass, getBestTime, getFormattedTime
} = useSudoku()

const bestTime = computed(() => {
  const t = getBestTime()
  if (t === undefined) return '-'
  const m = Math.floor(t / 60)
  const s = t % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const isNewRecord = computed(() => {
  const t = getBestTime()
  return t !== undefined && timer.value <= t
})

// 每个数字的剩余可填数量
function getRemainingCount(num: number): number {
  if (!board.value.length) return 9
  let count = 0
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board.value[r][c].value === num) count++
    }
  }
  return 9 - count
}

// 键盘事件
function handleKeydown(e: KeyboardEvent): void {
  if (!isRunning.value || isPaused.value || isCompleted.value) return

  const num = parseInt(e.key)
  if (num >= 1 && num <= 9) {
    inputNumber(num)
    return
  }

  switch (e.key) {
    case 'Backspace':
    case 'Delete':
      eraseCell()
      break
    case 'n':
    case 'N':
      noteMode.value = !noteMode.value
      break
    case 'ArrowUp':
      if (selectedRow.value > 0) selectCell(selectedRow.value - 1, selectedCol.value)
      else if (selectedRow.value === -1) selectCell(8, 4)
      break
    case 'ArrowDown':
      if (selectedRow.value < 8) selectCell(selectedRow.value + 1, selectedCol.value)
      else if (selectedRow.value === -1) selectCell(0, 4)
      break
    case 'ArrowLeft':
      if (selectedCol.value > 0) selectCell(selectedRow.value, selectedCol.value - 1)
      else if (selectedCol.value === -1) selectCell(4, 8)
      break
    case 'ArrowRight':
      if (selectedCol.value < 8) selectCell(selectedRow.value, selectedCol.value + 1)
      else if (selectedCol.value === -1) selectCell(4, 0)
      break
    case 'Escape':
      isPaused.value = !isPaused.value
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.sudoku-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #0a0a18;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.game-topbar {
  width: 100%;
  max-width: 440px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  gap: 8px;
  flex-shrink: 0;
}

.btn-back {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: #ccc; padding: 6px 14px; border-radius: 8px;
  cursor: pointer; font-size: 14px;
}
.btn-back:active { background: rgba(255,255,255,0.12); }

.score-area { display: flex; gap: 18px; }
.score-item { display: flex; flex-direction: column; align-items: center; }
.score-item .label { font-size: 14px; }
.score-item .value { font-size: 20px; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; }
.score-item .value.timer { color: #4cd964; }
.score-item .value.mistakes { color: #ff9500; }
.score-item .value.mistakes.max-mistakes { color: #ff4444; }
.score-item .value.high { color: #ffd700; font-size: 15px; }

.difficulty-bar {
  display: flex;
  gap: 8px;
  padding: 0 14px 8px;
  flex-shrink: 0;
}

.btn-diff {
  padding: 6px 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #888;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.btn-diff.active {
  background: rgba(88, 86, 214, 0.2);
  border-color: #5856d6;
  color: #5856d6;
}
.btn-diff:active { transform: scale(0.95); }

.board-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
}

.board {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(9, 1fr);
  gap: 1px;
  background: rgba(255,255,255,0.15);
  border: 3px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  width: min(90vw, 360px);
  height: min(90vw, 360px);
}

.cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  cursor: pointer;
  font-weight: 600;
  font-size: clamp(14px, 3.5vw, 20px);
  color: #e0e0e0;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}

/* 3x3 宫格粗边框 */
.cell:nth-child(3n) {
  border-right: 2px solid rgba(255,255,255,0.15);
}
.cell:nth-child(9n) {
  border-right: none;
}
.board :nth-child(9n+1) {
  /* first column of each row */;
}
.board :nth-child(3) ~ .cell:nth-child(3n+1) {
  /* handled by grid */;
}

/* 第3行和第6行底部加粗边框 */
/* 使用 row-based approach via inline style or class */
.cell {
  border-right: 1px solid rgba(255,255,255,0.08);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.cell-given {
  color: #fff;
  font-weight: 700;
}

.cell-selected {
  background: #3a3a6e !important;
  box-shadow: inset 0 0 0 2px #5856d6;
  z-index: 1;
}

.cell-related {
  background: #222240;
}

.cell-same-number {
  background: #2a2a50;
}

.cell-error {
  color: #ff4444 !important;
  animation: shake 0.3s ease;
}

.cell-note {
  font-size: 9px;
  font-weight: 500;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

.cell-value {
  line-height: 1;
}

.cell-notes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  place-items: center;
  font-size: 7px;
  color: #666;
  line-height: 1;
}

.note-num {
  visibility: hidden;
}
.note-num.visible {
  visibility: visible;
}

.numpad {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  padding: 10px 14px;
  width: 100%;
  max-width: 360px;
  flex-shrink: 0;
  padding-bottom: max(10px, env(safe-area-inset-bottom, 10px));
}

.btn-num {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  background: #1a1a2e;
  border: 1px solid rgba(255,255,255,0.1);
  color: #e0e0e0;
  border-radius: 10px;
  font-size: clamp(16px, 4vw, 20px);
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.1s;
}
.btn-num:active { transform: scale(0.92); background: #2a2a4e; }
.btn-num.has-count { opacity: 0.35; }

.num-count {
  font-size: 9px;
  font-weight: 400;
  color: #888;
}

.btn-note {
  font-size: 16px;
  background: #1a1a2e;
}
.btn-note.active {
  background: rgba(88, 86, 214, 0.3);
  border-color: #5856d6;
}

.btn-erase {
  font-size: 18px;
  color: #ff6b6b;
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
.hint { font-size: 13px; color: #888; max-width: 260px; line-height: 1.5; }
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

.btn-secondary {
  background: rgba(255,255,255,0.1);
  box-shadow: none;
  font-size: 14px;
  padding: 10px 24px;
}
</style>
