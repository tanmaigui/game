<template>
  <div class="home">
    <header class="home-header">
      <h1 class="title">🎮 小游戏中心</h1>
      <p class="subtitle">选择一个游戏开始玩吧</p>
    </header>

    <div class="game-list">
      <div class="game-card" @click="$router.push('/snake')">
        <div class="game-icon">🐍</div>
        <div class="game-info">
          <h2>贪吃蛇</h2>
          <p>经典贪吃蛇游戏，用方向键控制蛇的移动</p>
        </div>
        <div class="game-arrow">→</div>
      </div>

      <div class="game-card" @click="$router.push('/mole')">
        <div class="game-icon">🔨</div>
        <div class="game-info">
          <h2>打地鼠</h2>
          <p>快速点击冒出的地鼠，小心炸弹和金色地鼠！</p>
        </div>
        <div class="game-arrow">→</div>
      </div>

      <div class="game-card" @click="$router.push('/minesweeper')">
        <div class="game-icon">💣</div>
        <div class="game-info">
          <h2>扫雷</h2>
          <p>经典扫雷游戏，翻开格子避开所有地雷</p>
        </div>
        <div class="game-arrow">→</div>
      </div>

      <div class="game-card" @click="$router.push('/tetris')">
        <div class="game-icon">🧩</div>
        <div class="game-info">
          <h2>俄罗斯方块</h2>
          <p>经典俄罗斯方块，堆叠消除得分</p>
        </div>
        <div class="game-arrow">→</div>
      </div>

      <div class="game-card" @click="$router.push('/sudoku')">
        <div class="game-icon">🔢</div>
        <div class="game-info">
          <h2>数独</h2>
          <p>经典9×9数独，逻辑推理填数字</p>
        </div>
        <div class="game-arrow">→</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.home {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.home-header {
  text-align: center;
  padding: 30px 0 20px;
}

.title {
  font-size: clamp(24px, 5vw, 36px);
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.subtitle {
  margin-top: 8px;
  font-size: clamp(13px, 2.5vw, 16px);
  color: #888;
}

.game-list {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 40px;
}

.game-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.game-card:active:not(.disabled) {
  transform: scale(0.97);
  background: linear-gradient(135deg, #222244, #1c2a4a);
}

.game-card.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.game-card:not(.disabled):hover {
  border-color: rgba(255, 215, 0, 0.35);
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.08);
}

.game-icon {
  font-size: clamp(32px, 7vw, 42px);
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  flex-shrink: 0;
}

.game-info {
  flex: 1;
  min-width: 0;
}

.game-info h2 {
  font-size: clamp(15px, 3vw, 17px);
  font-weight: 600;
  color: #f0f0f0;
  margin-bottom: 4px;
}

.game-info p {
  font-size: clamp(11px, 2.2vw, 13px);
  color: #777;
  line-height: 1.4;
}

.game-arrow {
  font-size: 20px;
  color: #555;
  flex-shrink: 0;
}

.game-badge {
  font-size: 11px;
  color: #888;
  background: rgba(255, 255, 255, 0.06);
  padding: 3px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}
</style>
