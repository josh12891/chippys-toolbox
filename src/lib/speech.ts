let speaking = false

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function stopSpeech(): void {
  speaking = false
  if (canSpeak()) window.speechSynthesis.cancel()
}

export function isSpeaking(): boolean {
  return speaking
}

export function speakMarks(text: string, onEnd?: () => void): void {
  stopSpeech()
  if (!canSpeak()) {
    onEnd?.()
    return
  }
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-AU'
  utter.rate = 0.92
  utter.pitch = 1
  const voices = window.speechSynthesis.getVoices()
  const au = voices.find((v) => v.lang.toLowerCase().startsWith('en-au'))
  if (au) utter.voice = au
  utter.onend = () => {
    speaking = false
    onEnd?.()
  }
  utter.onerror = () => {
    speaking = false
    onEnd?.()
  }
  speaking = true
  window.speechSynthesis.speak(utter)
}
