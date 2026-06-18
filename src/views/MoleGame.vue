<template>
  <div class="mole-page">
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
          <span class="label">连击</span>
          <span class="value combo">{{ combo > 0 ? 'x' + combo : '-' }}</span>
        </div>
        <div class="score-item">
          <span class="label">最高</span>
          <span class="value high">{{ highScore }}</span>
        </div>
      </div>
    </header>

    <!-- 进度条 -->
    <div class="progress-bar" v-if="isRunning">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }" />
      <span class="progress-time">{{ timeLeft }}s</span>
    </div>

    <!-- 游戏区域 -->
    <div class="mole-grid">
      <div
        v-for="hole in holes"
        :key="hole.id"
        class="mole-hole"
        :class="{ active: hole.active }"
        @click="hitHole(hole.id)"
        @touchstart.prevent="hitHole(hole.id)"
      >
        <div class="hole-bg" />
        <div class="mole-character" v-if="hole.active" :class="hole.type">
          <span v-if="hole.type === 'normal'">🐹</span>
          <span v-else-if="hole.type === 'golden'">⭐</span>
          <span v-else>💣</span>
        </div>
      </div>
    </div>

    <!-- 开始/结束遮罩 -->
    <div class="game-board-wrapper">
      <div class="game-board" v-if="!isRunning && !isGameOver">
        <div class="overlay-content">
          <div class="game-icon-large">🔨</div>
          <h2>打地鼠</h2>
          <p class="hint">点击冒出的地鼠得分，小心炸弹！</p>
          <p class="hint hint-golden">⭐ 金色地鼠分数更高</p>
          <button class="btn-start" @click="startGame">
            <span>▶</span> 开始游戏
          </button>
        </div>
      </div>

      <div class="game-board" v-if="isGameOver">
        <div class="overlay-content gameover-overlay">
          <div class="gameover-text">时间到！</div>
          <div class="gameover-score">得分：{{ score }}</div>
          <div v-if="score >= highScore && score > 0" class="new-record">🎉 新纪录！</div>
          <button class="btn-start" @click="startGame">
            <span>🔄</span> 再来一局
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useWhackAMole } from '../games/useWhackAMole.js'

const {
  holes, score, highScore, timeLeft, progressPercent,
  isRunning, isGameOver, combo, startGame, hitHole
} = useWhackAMole()
</script>

<style scoped>
.mole-page {
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
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #ccc;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-back:active { background: rgba(255,255,255,0.12); }

.score-area { display: flex; gap: 16px; }
.score-item { display: flex; flex-direction: column; align-items: center; }
.score-item .label { font-size: 10px; color: #666; letter-spacing: 1px; }
.score-item .value { font-size: 22px; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; }
.score-item .value.high { color: #ffd700; font-size: 15px; }
.score-item .value.combo { color: #ff6b6b; font-size: 18px; }

.progress-bar {
  width: calc(100% - 28px);
  max-width: 412px;
  height: 20px;
  background: rgba(255,255,255,0.06);
  border-radius: 10px;
  margin: 4px 0 10px;
  position: relative;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4cd964, #34c759);
  border-radius: 10px;
  transition: width 1s linear;
}
.progress-time {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  color: #fff;
  font-weight: 600;
}

/* 地鼠网格 */
.mole-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 10px 20px;
  max-width: 360px;
  width: 100%;
  flex: 1;
  align-content: center;
}

.mole-hole {
  aspect-ratio: 1;
  position: relative;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.hole-bg {
  position: absolute;
  inset: 15% 10% 10% 10%;
  background: radial-gradient(ellipse at center, #1a1a30 0%, #0d0d1a 100%);
  border: 2px solid rgba(255,255,255,0.08);
  border-radius: 50%;
  box-shadow: inset 0 4px 12px rgba(0,0,0,0.5);
  transition: all 0.15s;
}

.mole-hole.active .hole-bg {
  border-color: rgba(255,255,255,0.2);
  box-shadow: inset 0 4px 12px rgba(0,0,0,0.5), 0 0 15px rgba(255,200,50,0.1);
}

.mole-character {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(32px, 10vw, 48px);
  animation: popUp 0.15s ease-out;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.mole-character.golden {
  font-size: clamp(28px, 9vw, 42px);
  animation: popUp 0.15s ease-out, goldenGlow 0.5s ease-in-out infinite alternate;
}

.mole-character.bomb {
  font-size: clamp(28px, 9vw, 42px);
  animation: popUp 0.15s ease-out, bombShake 0.3s ease-in-out infinite;
}

@keyframes popUp {
  from { transform: translateY(60%) scale(0.3); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes goldenGlow {
  from { filter: drop-shadow(0 0 8px rgba(255,215,0,0.6)); }
  to { filter: drop-shadow(0 0 20px rgba(255,215,0,1)); }
}

@keyframes bombShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

/* 开始/结束 */
.game-board-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.game-board {
  background: #111122;
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 30px 24px;
  text-align: center;
  max-width: 320px;
  width: 100%;
}
.overlay-content { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.game-icon-large { font-size: 48px; }
.overlay-content h2 { font-size: 22px; color: #fff; }
.hint { font-size: 13px; color: #888; line-height: 1.5; }
.hint-golden { color: #ffd700; font-size: 12px; }
.gameover-overlay { gap: 14px; }
.gameover-text { font-size: 24px; font-weight: 700; color: #fff; }
.gameover-score { font-size: 18px; color: #ccc; }
.new-record { font-size: 16px; color: #ffd700; animation: bounce 0.6s infinite alternate; }
@keyframes bounce { from { transform: scale(1); } to { transform: scale(1.1); } }

.btn-start {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 32px;
  background: linear-gradient(135deg, #ff9500, #ff6b35);
  color: #fff; border: none; border-radius: 25px;
  font-size: 17px; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 15px rgba(255,149,0,0.3);
}
.btn-start:active { transform: scale(0.95); }
</style>
