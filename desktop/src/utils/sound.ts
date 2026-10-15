import { useSystemStore } from '@/stores/systemStore'

let alertAudio: HTMLAudioElement | null = null
let lastPlayTime = 0
const COOLDOWN_MS = 4000 // Don't re-trigger alert sound within 4 seconds

/**
 * Initializes and unlocks audio for browsers that block autoplay
 * until a user gesture has occurred.
 */
function getOrCreateAudio(): HTMLAudioElement {
  if (!alertAudio) {
    alertAudio = new Audio('/alert.mp4')
    alertAudio.preload = 'auto'
  }
  return alertAudio
}

if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const audio = getOrCreateAudio()
      // Prime the audio element silently on first user interaction
      audio.load()
    } catch {
      // Ignore initial interaction error
    }
    window.removeEventListener('click', unlockAudio)
    window.removeEventListener('keydown', unlockAudio)
  }
  window.addEventListener('click', unlockAudio, { once: true })
  window.addEventListener('keydown', unlockAudio, { once: true })
}

/**
 * Plays the anomaly alert sound from /alert.mp4 if audio is not muted.
 * Throttled by COOLDOWN_MS to avoid rapid continuous overlapping sound.
 */
export function playAlertSound(force = false) {
  const isMuted = useSystemStore.getState().audioMuted
  if (isMuted) return

  const now = Date.now()
  if (!force && now - lastPlayTime < COOLDOWN_MS) {
    return
  }

  try {
    const audio = getOrCreateAudio()
    audio.currentTime = 0
    const playPromise = audio.play()
    lastPlayTime = now

    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay may be restricted until page interaction
        console.warn('Audio alert playback restricted by browser policy:', err)
      })
    }
  } catch (err) {
    console.error('Failed to play alert sound:', err)
  }
}

/**
 * Stops any currently playing alert sound.
 */
export function stopAlertSound() {
  if (alertAudio) {
    try {
      alertAudio.pause()
      alertAudio.currentTime = 0
    } catch {
      // Ignore
    }
  }
}
