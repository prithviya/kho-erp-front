let audioContext;

export function unlockNotificationSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext ||= new AudioContextClass();
  if (audioContext.state === "running") return;

  audioContext.resume().catch((error) => {
    console.warn("Unable to enable notification sounds.", error);
  });
}

export function playNotificationSound() {
  if (!audioContext || audioContext.state !== "running") return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(660, now);
  oscillator.frequency.setValueAtTime(880, now + 0.1);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.3);
}
