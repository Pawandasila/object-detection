import { throttle } from "lodash";

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.isEnabled = true;
    this.volume = 0.5;
    this.customAudioCache = null;
    this.isClient = typeof window !== 'undefined';
    
    // Only initialize on client side
    if (this.isClient) {
      this.initAudioContext();
      this.preloadCustomAudio();
    }
  }

  async initAudioContext() {
    if (!this.isClient) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.warn('Audio context initialization failed:', error);
    }
  }

  // Preload custom audio file
  async preloadCustomAudio() {
    if (!this.isClient) return;
    
    try {
      const audio = new Audio("/pols-aagyi-pols.mp3");
      audio.volume = 0; // Silent preload
      
      const loadPromise = new Promise((resolve, reject) => {
        audio.oncanplaythrough = () => {
          this.customAudioCache = audio;
          console.log("Custom audio file preloaded successfully");
          resolve();
        };
        audio.onerror = () => {
          console.warn("Custom audio file not found, will use fallback sounds");
          reject();
        };
        
        // Timeout after 3 seconds
        setTimeout(() => {
          console.warn("Custom audio preload timeout");
          reject();
        }, 3000);
      });
      
      audio.load(); // Start loading
      await loadPromise;
      
    } catch (error) {
      console.warn("Failed to preload custom audio:", error);
      this.customAudioCache = null;
    }
  }

  // Play preloaded custom audio
  async playCustomAudio() {
    if (!this.isClient || !this.customAudioCache) {
      return false;
    }
    
    try {
      // Clone the audio element to allow multiple simultaneous plays
      const audio = this.customAudioCache.cloneNode();
      audio.volume = this.volume;
      await audio.play();
      return true;
    } catch (error) {
      console.warn("Failed to play cached custom audio:", error);
      return false;
    }
  }

  // Load and cache audio files
  async loadSound(name, url) {
    if (!this.isClient || !this.audioContext) {
      return false;
    }
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
      return true;
    } catch (error) {
      console.warn(`Failed to load sound ${name}:`, error);
      return false;
    }
  }

  // Play cached sound
  playSound(name) {
    if (!this.isEnabled || !this.isClient || !this.audioContext || !this.sounds.has(name)) {
      return;
    }

    try {
      const audioBuffer = this.sounds.get(name);
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      gainNode.gain.value = this.volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
    } catch (error) {
      console.warn(`Failed to play sound ${name}:`, error);
    }
  }

  // Generate beep sound programmatically
  playBeep(frequency = 800, duration = 0.3, type = 'sine') {
    if (!this.isEnabled || !this.isClient || !this.audioContext) {
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Failed to play beep:', error);
    }
  }

  // Play different alert sounds for different object types
  playAlert(objectClass) {
    const alertSounds = {
      person: () => this.playBeep(800, 0.5, 'sine'),
      car: () => this.playBeep(400, 0.3, 'square'),
      truck: () => this.playBeep(300, 0.4, 'square'),
      motorcycle: () => this.playBeep(600, 0.2, 'triangle'),
      bicycle: () => this.playBeep(1000, 0.2, 'sine'),
      default: () => this.playBeep(500, 0.2, 'sine')
    };

    const playAlert = alertSounds[objectClass] || alertSounds.default;
    playAlert();
  }

  // Speech synthesis for object detection
  speak(text) {
    if (!this.isEnabled || !this.isClient || !window.speechSynthesis) {
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.volume;
      utterance.rate = 1.2;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Speech synthesis failed:', error);
    }
  }

  // Control methods
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Cleanup
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.sounds.clear();
  }
}

// Create singleton instance
const audioManager = new AudioManager();

// Throttled alert functions with custom audio priority
export const playPersonAlert = throttle(async () => {
  if (typeof window === 'undefined') return; // Skip on server
  
  try {
    // First try to play the preloaded custom audio
    const customAudioPlayed = await audioManager.playCustomAudio();
    
    if (!customAudioPlayed) {
      // If custom audio fails, try loading it fresh
      const audio = new Audio("/pols-aagyi-pols.mp3");
      audio.volume = audioManager.volume;
      await audio.play();
    }
    
  } catch (error) {
    console.warn("All custom audio attempts failed, using fallback beep:", error.message);
    audioManager.playAlert('person');
  }
}, 2000);

export const playVehicleAlert = throttle((vehicleType) => {
  if (typeof window === 'undefined') return; // Skip on server
  audioManager.playAlert(vehicleType);
}, 1500);

export const speakDetection = throttle((objectClass, count) => {
  if (typeof window === 'undefined') return; // Skip on server
  const text = count > 1 
    ? `${count} ${objectClass}s detected` 
    : `${objectClass} detected`;
  audioManager.speak(text);
}, 3000);

// Enhanced audio with priority to custom sound file
export const playAudio = throttle(async () => {
  if (typeof window === 'undefined') return; // Skip on server
  
  try {
    // First try preloaded custom audio
    const customAudioPlayed = await audioManager.playCustomAudio();
    
    if (!customAudioPlayed) {
      // If preloaded fails, try fresh load
      const audio = new Audio("/pols-aagyi-pols.mp3");
      audio.volume = audioManager.volume;
      await audio.play();
      console.log("Playing fresh custom audio file");
    } else {
      console.log("Playing preloaded custom audio file");
    }
    
  } catch (error) {
    console.warn("Custom audio failed, using fallback:", error.message);
    // Fallback to generated beep
    audioManager.playAlert('person');
  }
}, 2000);

export default audioManager;
