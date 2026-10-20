import { ref } from 'vue'

// 基于 Web Audio API 的轻量音效引擎：实时合成，无需音频文件
const STORAGE_KEY = 'game_sound_enabled'

export const soundEnabled = ref(localStorage.getItem(STORAGE_KEY) !== '0')

let ctx: AudioContext | null = null
let lastMoveAt = 0

export function setSoundEnabled(v: boolean): void {
  soundEnabled.value = v
  localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
}

export function toggleSound(): void {
  setSoundEnabled(!soundEnabled.value)
}

// 懒创建 AudioContext，并在需要时恢复（浏览器自动播放策略）
function getCtx(): AudioContext | null {
  if (!soundEnabled.value) return null
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface ToneOptions {
  freq: number
  freqEnd?: number
  type?: OscillatorType
  duration?: number
  volume?: number
  delay?: number
}

export function playTone(opt: ToneOptions): void {
  const ac = getCtx()
  if (!ac) return
  const {
    freq,
    freqEnd,
    type = 'square',
    duration = 0.08,
    volume = 0.12,
    delay = 0
  } = opt

  const start = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (freqEnd && freqEnd !== freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), start + duration)
  }

  // 音量包络，避免开始/结束时的爆音
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

export type SoundName =
  | 'move'
  | 'rotate'
  | 'lock'
  | 'clear'
  | 'gameover'
  | 'levelup'
  | 'start'

export function playSound(name: SoundName, extra?: { lines?: number }): void {
  if (!soundEnabled.value) return

  switch (name) {
    case 'move': {
      // 连续移动时限流，避免声音堆叠刺耳
      const now = performance.now()
      if (now - lastMoveAt < 45) return
      lastMoveAt = now
      playTone({ freq: 200, type: 'square', duration: 0.035, volume: 0.05 })
      break
    }
    case 'rotate':
      playTone({ freq: 320, freqEnd: 460, type: 'square', duration: 0.06, volume: 0.07 })
      break
    case 'lock':
      playTone({ freq: 150, freqEnd: 110, type: 'triangle', duration: 0.09, volume: 0.1 })
      break
    case 'clear': {
      const n = Math.min(4, Math.max(1, extra?.lines ?? 1))
      const notes = [523.25, 659.25, 783.99, 1046.5]
      for (let i = 0; i < n + 1; i++) {
        playTone({
          freq: notes[i % notes.length],
          type: 'square',
          duration: 0.1,
          volume: 0.11,
          delay: i * 0.07
        })
      }
      break
    }
    case 'levelup': {
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((f, i) =>
        playTone({ freq: f, type: 'triangle', duration: 0.12, volume: 0.1, delay: i * 0.06 })
      )
      break
    }
    case 'start': {
      playTone({ freq: 392, type: 'triangle', duration: 0.09, volume: 0.1 })
      playTone({ freq: 587.33, type: 'triangle', duration: 0.12, volume: 0.1, delay: 0.09 })
      break
    }
    case 'gameover':
      playTone({ freq: 440, freqEnd: 110, type: 'sawtooth', duration: 0.5, volume: 0.12 })
      playTone({ freq: 220, freqEnd: 55, type: 'sawtooth', duration: 0.6, volume: 0.08, delay: 0.08 })
      break
  }
}
