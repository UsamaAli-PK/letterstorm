import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Download, Twitter, Facebook, Linkedin, MessageCircle, Trophy } from 'lucide-react';
import { getRandomWord, words } from '../lib/words';

let audioCtx: AudioContext | null = null;
let sfxGainNode: GainNode | null = null;
let musicGainNode: GainNode | null = null;
let isMusicPlaying = false;
const musicOscillators: OscillatorNode[] = [];
let globalSfxVolume = 0.5;
let globalMusicVolume = 0.5;

export const updateSfxVolume = (vol: number) => { 
    globalSfxVolume = vol / 100; 
    if (sfxGainNode && audioCtx) {
        sfxGainNode.gain.setTargetAtTime(globalSfxVolume, audioCtx.currentTime, 0.1);
    }
};

export const updateMusicVolume = (vol: number) => { 
    globalMusicVolume = vol / 100;
    if (musicGainNode && audioCtx) {
        musicGainNode.gain.setTargetAtTime(globalMusicVolume, audioCtx.currentTime, 0.1);
    }
};

const initAudio = () => {
    try {
        if (!audioCtx) {
            const AContext = window.AudioContext || (window as any).webkitAudioContext;
            audioCtx = new AContext();
            
            sfxGainNode = audioCtx.createGain();
            sfxGainNode.gain.value = globalSfxVolume;
            sfxGainNode.connect(audioCtx.destination);
            
            musicGainNode = audioCtx.createGain();
            musicGainNode.gain.value = globalMusicVolume;
            musicGainNode.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch(err) {
        console.error("Audio init error", err);
    }
};

const startAmbientMusic = () => {
    initAudio();
    if (isMusicPlaying || !audioCtx || !musicGainNode) return;
    isMusicPlaying = true;
    
    // Play a gentle, airy pentatonic/major chord to create a very relaxing, peaceful drone
    const freqs = [130.81, 164.81, 196.00, 246.94, 329.63]; // C3, E3, G3, B3, E4 (C Major 7 / 9 feel)
    freqs.forEach((freq, idx) => {
        const osc = audioCtx!.createOscillator();
        // Mix sine with triangle for a slightly warmer, breathier tone
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        
        const panNode = audioCtx!.createStereoPanner ? audioCtx!.createStereoPanner() : audioCtx!.createGain();
        if (panNode instanceof StereoPannerNode) {
            panNode.pan.value = (idx % 2 === 0 ? -0.5 : 0.5) * (idx / freqs.length);
        }
        
        const lfo = audioCtx!.createOscillator();
        lfo.type = 'sine';
        // Very slow, peaceful swells
        lfo.frequency.value = 0.03 + idx * 0.01;

        const lfoGain = audioCtx!.createGain();
        // Gentle fluctuation
        lfoGain.gain.value = 0.03; 
        
        const baseGain = audioCtx!.createGain();
        // Low overall volume for peacefulness
        baseGain.gain.value = 0.02 + (1 / (idx + 1)) * 0.02; 
        
        lfo.connect(lfoGain);
        lfoGain.connect(baseGain.gain);
        
        // Add a lowpass filter to make it softer and warmer
        const filter = audioCtx!.createBiquadFilter();
        filter.type = 'lowpass';
        // Filter out harsh high frequencies
        filter.frequency.value = 800 + idx * 200; 
        
        osc.connect(filter);
        filter.connect(baseGain);
        
        if (panNode instanceof StereoPannerNode) {
            baseGain.connect(panNode);
            panNode.connect(musicGainNode!);
        } else {
            baseGain.connect(musicGainNode!);
        }

        // Slow fade in
        baseGain.gain.setValueAtTime(0, audioCtx!.currentTime);
        baseGain.gain.linearRampToValueAtTime(0.02 + (1 / (idx + 1)) * 0.02, audioCtx!.currentTime + 5);

        osc.start();
        lfo.start();
        musicOscillators.push(osc, lfo);
    });
};

const playShootSound = () => {
    try {
        if (globalSfxVolume <= 0) return;
        initAudio();
        if (!audioCtx || !sfxGainNode) return;
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(sfxGainNode);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch(err) {
        console.error(err);
    }
};

const playHitSound = () => {
    try {
        if (globalSfxVolume <= 0) return;
        initAudio();
        if (!audioCtx || !sfxGainNode) return;
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(sfxGainNode);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } catch(err) {}
};

const playPowerupSound = () => {
    try {
        if (globalSfxVolume <= 0) return;
        initAudio();
        if (!audioCtx || !sfxGainNode) return;
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(sfxGainNode);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch(err) {}
};

const playGameOverSound = () => {
    try {
        if (globalSfxVolume <= 0) return;
        initAudio();
        if (!audioCtx || !sfxGainNode) return;
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1);
        osc.connect(gain);
        gain.connect(sfxGainNode);
        osc.start();
        osc.stop(audioCtx.currentTime + 1);
    } catch(err) {}
};

type GameState = 'menu' | 'playing' | 'gameover' | 'levelcomplete';

interface Enemy {
  id: string;
  word: string;
  typed: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  speed: number;
  powerUpType?: 'multiplier' | 'slow' | 'nuke';
  startX: number;
  wanderOffset: number;
  wanderSpeed: number;
}

interface GameStats {
  score: number;
  wave: number;
  combo: number;
  maxCombo: number;
  totalTyped: number;
  correctTyped: number;
  startTime: number;
  endTime: number;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  targetId: string;
  targetX: number;
  targetY: number;
  isFinal?: boolean;
  powerUpType?: 'multiplier' | 'slow' | 'nuke';
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

type DifficultyLevel = 'easy' | 'medium' | 'hard';

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [playerName, setPlayerName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [customWordsInput, setCustomWordsInput] = useState<string>('');
  const [showCustomWordsModal, setShowCustomWordsModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [sfxVol, setSfxVol] = useState<number>(50);
  const [musicVol, setMusicVol] = useState<number>(50);
  const [aimAssist, setAimAssist] = useState<boolean>(true);
  const [enemies, setEnemies] = useState<Enemy[]>([]);

  useEffect(() => {
    const handleFirstSync = () => {
        startAmbientMusic();
        window.removeEventListener('click', handleFirstSync);
        window.removeEventListener('keydown', handleFirstSync);
    };
    window.addEventListener('click', handleFirstSync);
    window.addEventListener('keydown', handleFirstSync);
    return () => {
        window.removeEventListener('click', handleFirstSync);
        window.removeEventListener('keydown', handleFirstSync);
    };
  }, []);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    wave: 1,
    combo: 0,
    maxCombo: 0,
    totalTyped: 0,
    correctTyped: 0,
    startTime: 0,
    endTime: 0,
  });
  const [targetId, setTargetId] = useState<string | null>(null);
  const [activeEffects, setActiveEffects] = useState({ slow: 0, multiplier: 0 });
  const [currentInput, setCurrentInput] = useState<string>('');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Refs for the loop
  const activeEffectsRef = useRef({ slow: 0, multiplier: 0 });
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const statsRef = useRef<GameStats>(stats);
  const targetIdRef = useRef<string | null>(null);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const gameStateRef = useRef<GameState>('menu');
  const requestRef = useRef<number>(0);
  
  // Wave settings
  const waveSettingsRef = useRef({
    spawnInterval: 2000,
    baseSpeed: 5,
    enemiesToSpawn: 10,
    enemiesSpawned: 0,
  });

  // Sync state to refs for the animation loop
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { targetIdRef.current = targetId; }, [targetId]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const getDifficultyParams = (diff: DifficultyLevel, wave: number) => {
    let mult = diff === 'easy' ? 0.7 : diff === 'medium' ? 1.0 : diff === 'hard' ? 1.3 : 1.1; // Custom defaults to slightly harder avg
    return {
        spawnInterval: Math.max(300, (2500 - (wave * 250)) / mult),
        baseSpeed: (4 + (wave * 1.5)) * mult,
        enemiesToSpawn: Math.floor((6 + (wave * 4)) * (diff === 'hard' ? 1.5 : 1)),
    };
  };

  const startGame = () => {
    const now = Date.now();
    setStats({
      score: 0,
      wave: 1,
      combo: 0,
      maxCombo: 0,
      totalTyped: 0,
      correctTyped: 0,
      startTime: now,
      endTime: now,
    });
    setTargetId(null);
    setCurrentInput('');
    enemiesRef.current = [];
    projectilesRef.current = [];
    setEnemies([]);
    setProjectiles([]);
    activeEffectsRef.current = { slow: 0, multiplier: 0 };
    setActiveEffects({ slow: 0, multiplier: 0 });
    
    const params = getDifficultyParams(difficulty, 1);
    waveSettingsRef.current = {
      spawnInterval: params.spawnInterval,
      baseSpeed: params.baseSpeed,
      enemiesToSpawn: params.enemiesToSpawn,
      enemiesSpawned: 0,
    };
    
    setGameState('playing');
  };

  const startNextWave = () => {
    const nextWave = statsRef.current.wave + 1;
    setStats(prev => ({ ...prev, wave: nextWave }));
    setTargetId(null);
    setCurrentInput('');
    enemiesRef.current = [];
    projectilesRef.current = [];
    setEnemies([]);
    setProjectiles([]);
    activeEffectsRef.current = { slow: 0, multiplier: 0 };
    setActiveEffects({ slow: 0, multiplier: 0 });
    
    const params = getDifficultyParams(difficulty, nextWave);
    waveSettingsRef.current = {
      spawnInterval: params.spawnInterval,
      baseSpeed: params.baseSpeed,
      enemiesToSpawn: params.enemiesToSpawn,
      enemiesSpawned: 0,
    };
    
    setGameState('playing');
  };

  const spawnExplosion = (x: number, y: number, color: string, count: number) => {
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 10 + Math.random() * 40;
          particlesRef.current.push({
              id: Math.random().toString(),
              x, y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 400 + Math.random() * 200,
              maxLife: 600,
              color,
              size: 2 + Math.random() * 4
          });
      }
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
      floatingTextsRef.current.push({
          id: Math.random().toString(),
          x, y, text, color, life: 1000
      });
  };

  const spawnEnemy = () => {
    const wave = statsRef.current.wave;
    let wordDifficulty: 'easy' | 'medium' | 'hard' = 'easy';
    
    if (wave === 1) wordDifficulty = Math.random() > 0.8 ? 'medium' : 'easy';
    else if (wave === 2) wordDifficulty = Math.random() > 0.4 ? 'medium' : 'easy';
    else if (wave === 3) wordDifficulty = Math.random() > 0.7 ? 'hard' : (Math.random() > 0.3 ? 'medium' : 'easy');
    else if (wave === 4) wordDifficulty = Math.random() > 0.5 ? 'hard' : 'medium';
    else if (wave >= 5) wordDifficulty = Math.random() > 0.2 ? 'hard' : 'medium';

    const word = getRandomWord(wordDifficulty);
    const startX = 15 + Math.random() * 70;
    const newEnemy: Enemy = {
      id: Math.random().toString(36).substr(2, 9),
      word,
      typed: '',
      x: startX,
      y: -10, // Start slightly above screen
      speed: waveSettingsRef.current.baseSpeed + Math.random() * 2, // slightly random speed
      startX,
      wanderOffset: Math.random() * Math.PI * 2,
      wanderSpeed: 1 + Math.random() * 2,
    };
    
    enemiesRef.current.push(newEnemy);
    waveSettingsRef.current.enemiesSpawned += 1;
  };

  const gameLoop = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    let deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    if (deltaTime > 100) deltaTime = 100; // Cap to avoid large jumps if tab was inactive

    // Spawning logic
    if (waveSettingsRef.current.enemiesSpawned < waveSettingsRef.current.enemiesToSpawn) {
      spawnTimerRef.current -= deltaTime;
      if (spawnTimerRef.current <= 0) {
        spawnEnemy();
        spawnTimerRef.current = waveSettingsRef.current.spawnInterval;
      }
    }

    // Update enemies
    let lifeLost = false;
    let effectsChanged = false;
    const speedMult = activeEffectsRef.current.slow > 0 ? 0.4 : 1;

    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const enemy = enemiesRef.current[i];
      enemy.y += (enemy.speed * speedMult * deltaTime) / 1000; // speed is % per second
      
      // Wobble horizontally but ensure it doesn't move too jaggedly
      enemy.x = enemy.startX + Math.sin((time / 1000) * enemy.wanderSpeed + enemy.wanderOffset) * 15;
      enemy.x = Math.max(10, Math.min(90, enemy.x));

      if (enemy.y >= 100) {
        // Escaped
        const escaped = enemiesRef.current.splice(i, 1)[0];
        if (!escaped.powerUpType) {
            lifeLost = true;
        }
        // If this was target, drop it
        if (targetIdRef.current === escaped.id) {
            setTargetId(null);
            setCurrentInput('');
        }
      }
    }

    // Update projectiles
    for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const proj = projectilesRef.current[i];
        let tx = proj.targetX;
        let ty = proj.targetY;
        
        const target = enemiesRef.current.find(e => e.id === proj.targetId);
        if (target) {
            tx = target.x;
            ty = target.y;
        }

        const dx = tx - proj.x;
        const dy = ty - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const speed = 250 * (deltaTime / 1000); // 250% screen per sec
        
        if (dist <= speed) {
            const p = projectilesRef.current.splice(i, 1)[0];
            if (p.isFinal) {
                if (p.powerUpType) {
                    playPowerupSound();
                    spawnExplosion(p.targetX, p.targetY, '#a855f7', 30); // purple
                } else {
                    playHitSound();
                    spawnExplosion(p.targetX, p.targetY, '#34d399', 15); // green
                }
            } else {
                spawnExplosion(p.targetX, p.targetY, '#fde047', 3); // tiny yellow spark
            }
        } else {
            proj.x += (dx / dist) * speed;
            proj.y += (dy / dist) * speed;
        }
    }

    if (activeEffectsRef.current.slow > 0) {
      activeEffectsRef.current.slow = Math.max(0, activeEffectsRef.current.slow - deltaTime);
      effectsChanged = true;
    }
    if (activeEffectsRef.current.multiplier > 0) {
      activeEffectsRef.current.multiplier = Math.max(0, activeEffectsRef.current.multiplier - deltaTime);
      effectsChanged = true;
    }
    
    if (effectsChanged) {
      setActiveEffects({ ...activeEffectsRef.current });
    }

    // Update Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
       let p = particlesRef.current[i];
       p.x += p.vx * deltaTime / 1000;
       p.y += p.vy * deltaTime / 1000;
       p.life -= deltaTime;
       if (p.life <= 0) particlesRef.current.splice(i, 1);
    }

    // Update Floating Texts
    for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
       let ft = floatingTextsRef.current[i];
       ft.y -= 10 * deltaTime / 1000; // float up (percentage wise -> screen height)
       ft.life -= deltaTime;
       if (ft.life <= 0) floatingTextsRef.current.splice(i, 1);
    }

    if (lifeLost) {
      statsRef.current.combo = 0;
      statsRef.current.endTime = Date.now();
      setStats({ ...statsRef.current });
      
      const container = document.getElementById('game-container');
      if (container) {
          container.style.boxShadow = 'inset 0 0 50px red';
          setTimeout(() => { container.style.boxShadow = ''; }, 150);
      }
      
      playGameOverSound();
      setGameState('gameover');
      return;
    }

    // Check level complete
    if (waveSettingsRef.current.enemiesSpawned >= waveSettingsRef.current.enemiesToSpawn && 
        enemiesRef.current.length === 0) {
      setGameState('levelcomplete');
    }

    setEnemies([...enemiesRef.current]);
    setProjectiles([...projectilesRef.current]);
    setParticles([...particlesRef.current]);
    setFloatingTexts([...floatingTextsRef.current]);
    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameLoop]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'playing') return;
      
      const key = e.key.toLowerCase();
      
      if (key === 'backspace' || key === 'escape') {
        e.preventDefault();
        if (targetIdRef.current) {
          const targetIndex = enemiesRef.current.findIndex(en => en.id === targetIdRef.current);
          if (targetIndex !== -1) {
            enemiesRef.current[targetIndex].typed = '';
          }
          setTargetId(null);
          setCurrentInput('');
        }
        return;
      }

      if (e.repeat) return; // Ignore key holds

      if (!/^[a-z]$/.test(key)) {
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          e.preventDefault();
          return;
      }

      e.preventDefault();

      statsRef.current.totalTyped += 1;
      
      const triggerRecoil = () => {
          playShootSound();
          const barrel = document.getElementById('gun-barrel');
          if (barrel) {
              barrel.style.transform = 'translateY(12px)';
              setTimeout(() => {
                  if (barrel) barrel.style.transform = 'translateY(0)';
              }, 50);
          }
      };

      let matched = false;

      if (targetIdRef.current) {
        // We have a target.
        const targetIndex = enemiesRef.current.findIndex(en => en.id === targetIdRef.current);
        if (targetIndex !== -1) {
          const target = enemiesRef.current[targetIndex];
          const expectedChar = target.word[target.typed.length];
          
          if (key === expectedChar) {
            target.typed += key;
            matched = true;
            setCurrentInput(target.typed);
            triggerRecoil(); // Trigger visual logic and sound
            
            projectilesRef.current.push({
               id: Math.random().toString(36).substr(2, 9),
               x: 50,
               y: 100,
               targetId: target.id,
               targetX: target.x,
               targetY: target.y,
               isFinal: target.typed === target.word,
               powerUpType: target.typed === target.word ? target.powerUpType : undefined
            });
            
            if (target.typed === target.word) {
              // Destroyed
              const isPowerUp = !!target.powerUpType;
              const baseScore = target.word.length * 10;
              const multiplierEffect = activeEffectsRef.current.multiplier > 0 ? 2 : 1;
              const comboMult = 1 + Math.floor(statsRef.current.combo / 5) * 0.5;
              
              if (!isPowerUp) {
                  const points = Math.floor(baseScore * comboMult) * multiplierEffect;
                  statsRef.current.score += points;
                  statsRef.current.combo += 1;
                  statsRef.current.maxCombo = Math.max(statsRef.current.maxCombo, statsRef.current.combo);
                  
                  spawnFloatingText(target.x, target.y - 5, `+${points}`, comboMult > 1.5 ? '#fde047' : '#34d399');
                  
                  // Chance to spawn power up
                  if (Math.random() < 0.1) {
                     const pTypes: Array<'multiplier'|'slow'|'nuke'> = ['multiplier', 'slow', 'nuke'];
                     const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
                     const pWord = pType === 'multiplier' ? 'boost' : (pType === 'slow' ? 'slow' : 'nuke');
                     enemiesRef.current.push({
                       id: Math.random().toString(36).substr(2, 9),
                       word: pWord,
                       typed: '',
                       x: target.x,
                       y: target.y,
                       speed: waveSettingsRef.current.baseSpeed * 0.8,
                       powerUpType: pType,
                       startX: target.x,
                       wanderOffset: Math.random() * Math.PI * 2,
                       wanderSpeed: 1 + Math.random() * 2,
                     });
                  }
              } else {
                  // Apply power up
                  if (target.powerUpType === 'slow') {
                     activeEffectsRef.current.slow += 10000;
                  } else if (target.powerUpType === 'multiplier') {
                     activeEffectsRef.current.multiplier += 10000;
                     spawnFloatingText(target.x, target.y - 5, "2X SCORE!", "#d8b4fe");
                  } else if (target.powerUpType === 'nuke') {
                     let nukePoints = 0;
                     spawnFloatingText(target.x, target.y - 5, "NUKE!", "#fca5a5");
                     enemiesRef.current = enemiesRef.current.filter(en => {
                         if (!en.powerUpType && en.id !== target.id) {
                            nukePoints += (en.word.length * 10) * multiplierEffect;
                            spawnExplosion(en.x, en.y, '#ef4444', 20);
                            return false;
                         }
                         return true;
                     });
                     statsRef.current.score += nukePoints;
                     // flash screen
                     const container = document.getElementById('game-container');
                     if (container) {
                         container.style.backgroundColor = 'white';
                         setTimeout(() => { container.style.backgroundColor = ''; }, 150);
                     }
                  }
              }
              
              const updatedIdx = enemiesRef.current.findIndex(e => e.id === target.id);
              if (updatedIdx !== -1) {
                 enemiesRef.current.splice(updatedIdx, 1);
              }
              setTargetId(null);
              setCurrentInput('');
            }
          } else {
             // Miss
             statsRef.current.combo = 0;
             spawnFloatingText(target.x, target.y - 10, "MISS", "#ef4444");
             // Flash screen and shake target
             const container = document.getElementById('game-container');
             if (container) {
                 container.style.backgroundColor = '#450a0a'; // dark red
                 setTimeout(() => { container.style.backgroundColor = ''; }, 100);
             }
             const enemyEl = document.getElementById(`enemy-${target.id}`);
             if (enemyEl) {
                 enemyEl.style.transform = `translateX(10px)`;
                 setTimeout(() => { if (enemyEl) enemyEl.style.transform = ''; }, 50);
             }
          }
        } else {
           // Target somehow lost, reset
           setTargetId(null);
           setCurrentInput('');
        }
      } else {
         // No target, find one
         // Find enemies starting with typed key
         const possibleTargets = enemiesRef.current.filter(en => en.word.startsWith(key));
         if (possibleTargets.length > 0) {
             // Pick the lowest one (closest to bottom)
             possibleTargets.sort((a, b) => b.y - a.y);
             const target = possibleTargets[0];
             target.typed = key;
             setTargetId(target.id);
             setCurrentInput(target.typed);
             matched = true;
             triggerRecoil(); // Trigger visual logic and sound
             
             projectilesRef.current.push({
               id: Math.random().toString(36).substr(2, 9),
               x: 50,
               y: 100,
               targetId: target.id,
               targetX: target.x,
               targetY: target.y,
               isFinal: target.typed === target.word,
               powerUpType: target.typed === target.word ? target.powerUpType : undefined
             });
         } else {
             statsRef.current.combo = 0;
             spawnFloatingText(50, 95, "MISS", "#ef4444"); // show miss near bottom
             const container = document.getElementById('game-container');
             if (container) {
                 container.style.backgroundColor = '#450a0a';
                 setTimeout(() => { container.style.backgroundColor = ''; }, 100);
             }
         }
      }

      if (matched) {
          statsRef.current.correctTyped += 1;
      }
      // setStats({ ...statsRef.current });
      // setEnemies([...enemiesRef.current]);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const accuracy = Math.round(
      stats.totalTyped > 0 ? (stats.correctTyped / stats.totalTyped) * 100 : 0
  );
  
  const timePlayedSec = Math.max(0, (stats.endTime - stats.startTime) / 1000);
  const timePlayedMin = timePlayedSec / 60;
  const wpm = timePlayedMin > 0 ? Math.round((stats.correctTyped / 5) / timePlayedMin) : 0;
  const mm = Math.floor(timePlayedSec / 60).toString().padStart(2, '0');
  const ss = Math.floor(timePlayedSec % 60).toString().padStart(2, '0');

  const downloadReport = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 750;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Background (Dark Zinc)
    ctx.fillStyle = '#09090b'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Subtle Grid Pattern
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
    ctx.lineWidth = 1;
    for(let i = 0; i < canvas.width; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let i = 0; i < canvas.height; i += 30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

    // Outer Neon Border
    ctx.strokeStyle = '#10b981'; // emerald-500
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
    
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(42, 42, canvas.width - 84, canvas.height - 84);

    // Tech Corners
    ctx.fillStyle = '#10b981';
    const cornerSize = 40;
    const margin = 30;
    // Top Left
    ctx.fillRect(margin, margin, cornerSize, 6);
    ctx.fillRect(margin, margin, 6, cornerSize);
    // Top Right
    ctx.fillRect(canvas.width - margin - cornerSize, margin, cornerSize, 6);
    ctx.fillRect(canvas.width - margin - 6, margin, 6, cornerSize);
    // Bottom Left
    ctx.fillRect(margin, canvas.height - margin - 6, cornerSize, 6);
    ctx.fillRect(margin, canvas.height - margin - cornerSize, 6, cornerSize);
    // Bottom Right
    ctx.fillRect(canvas.width - margin - cornerSize, canvas.height - margin - 6, cornerSize, 6);
    ctx.fillRect(canvas.width - margin - 6, canvas.height - margin - cornerSize, 6, cornerSize);

    // Background Graphic Elements (Cyberpunk Slashes)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.03)';
    ctx.beginPath();
    ctx.moveTo(200, canvas.height);
    ctx.lineTo(500, 0);
    ctx.lineTo(800, 0);
    ctx.lineTo(500, canvas.height);
    ctx.fill();

    // Top Title Area
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#34d399'; // emerald-400
    ctx.font = 'italic 900 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LETTERSTORM', canvas.width / 2, 140);
    ctx.shadowBlur = 0; // reset shadow
    
    ctx.fillStyle = '#a7f3d0'; // emerald-200
    ctx.font = 'bold 24px monospace';
    ctx.letterSpacing = '12px';
    ctx.fillText('OFFICIAL PERFORMANCE RECORD', canvas.width / 2, 190);
    ctx.letterSpacing = '0px';

    // Center Hexagon/Badge Background
    ctx.fillStyle = 'rgba(2, 44, 34, 0.6)'; // emerald-950
    ctx.strokeStyle = '#059669'; // emerald-600
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 275);
    ctx.lineTo(1050, 275);
    ctx.lineTo(1100, 400);
    ctx.lineTo(1050, 525);
    ctx.lineTo(150, 525);
    ctx.lineTo(100, 400);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left Seal (Tech Hexagon)
    const drawHexagon = (x: number, y: number, r: number, fill: string, stroke: string, glow = 0) => {
        ctx.shadowColor = stroke;
        ctx.shadowBlur = glow;
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = x + r * Math.cos(angle);
            const py = y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
    };

    drawHexagon(140, 140, 50, '#022c22', '#10b981', 15);
    drawHexagon(140, 140, 40, '#064e3b', '#34d399', 0);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SYS', 140, 135);
    ctx.fillText('OP', 140, 155);

    drawHexagon(canvas.width - 140, 140, 50, '#022c22', '#10b981', 15);
    drawHexagon(canvas.width - 140, 140, 40, '#064e3b', '#34d399', 0);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(difficulty.substring(0,3).toUpperCase(), canvas.width - 140, 146);

    // Player Header
    ctx.fillStyle = '#6ee7b7'; // emerald-300
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('// AGENT IDENTIFICATION', 150, 260);

    // The Grid of Stats Inside the Hex Shape
    // Column 1 (Left Side)
    const col1X = 220;
    ctx.fillStyle = '#a7f3d0';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DESIGNATION', col1X, 340);
    ctx.fillText('FINAL TALLY', col1X, 440);

    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'left'; // Explicitly setting to left
    ctx.fillText((playerName || 'GUEST').toUpperCase(), col1X, 390);
    
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 44px monospace';
    ctx.fillText(stats.score.toLocaleString(), col1X, 490);
    ctx.shadowBlur = 0;

    // Divider Line inside
    ctx.strokeStyle = '#059669';
    ctx.beginPath(); ctx.moveTo(560, 310); ctx.lineTo(560, 490); ctx.stroke();

    // Column 2 (Right Side)
    const col2XLabel = 620;
    const col2XValue = 980;

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left'; // Labels are left aligned
    ctx.fillText('WAVE REACHED', col2XLabel, 360);
    ctx.fillText('INTELLIGENCE (WPM)', col2XLabel, 420);
    ctx.fillText('PRECISION (ACC)', col2XLabel, 480);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'right'; // Values are right aligned
    ctx.fillText(stats.wave.toString(), col2XValue, 365);
    ctx.fillText(wpm.toString(), col2XValue, 425);
    ctx.fillText(`${accuracy}%`, col2XValue, 485);

    // Footer lines
    ctx.strokeStyle = '#059669';
    ctx.beginPath(); ctx.moveTo(450, 650); ctx.lineTo(850, 650); ctx.stroke();
    
    // Barcode mock (just varying lines)
    ctx.fillStyle = '#10b981';
    let dx = canvas.width - 300;
    for(let i=0; i<40; i++) {
        const w = Math.random() * 6 + 1;
        ctx.fillRect(dx, 620, w, 60);
        dx += w + Math.random() * 4 + 1;
        if(dx > canvas.width - 50) break;
    }
    
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AUTHENTICATION PROTOCOL', canvas.width - 175, 700);
    
    ctx.fillStyle = '#10b981';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    const cleanDate = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'medium' }).toUpperCase();
    ctx.fillText(cleanDate, 650, 635);
    
    ctx.textAlign = 'left';
    ctx.font = 'italic 900 34px sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText('LETTERSTORM', 100, 645);
    
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#059669';
    ctx.fillText('[ ENCRYPTED & VERIFIED BY NEURAL NET ]', 100, 675);

    const link = document.createElement('a');
    link.download = `Letterstorm_Record_${playerName || 'Guest'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const suggestedTarget = aimAssist && !targetId && enemies.length > 0 
      ? [...enemies].sort((a, b) => b.y - a.y)[0] 
      : null;

  return (
    <div id="game-container" className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden font-mono text-white selection:bg-transparent transition-colors duration-75">
        
      {/* HUD Background elements */}
      <div className="absolute inset-0 pointer-events-none" 
           style={{
               background: 'radial-gradient(circle at 50% 100%, rgba(0,255,0,0.05) 0%, transparent 60%)',
               overflow: 'hidden'
           }}>
          <div className="starfield-slow z-0" />
          <div className="starfield z-0" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-10" 
               style={{ 
                   backgroundImage: 'linear-gradient(#00ff00 1px, transparent 1px), linear-gradient(90deg, #00ff00 1px, transparent 1px)',
                   backgroundSize: '40px 40px'
               }} 
          />
      </div>

      {/* Main UI */}
      <div className="relative z-10 w-full max-w-4xl mx-auto h-full flex flex-col">
          
        {/* Active Effects Display */}
        {gameState === 'playing' && (
            <div className="absolute top-24 left-4 flex flex-col gap-2 z-10 font-bold">
                {activeEffects.slow > 0 && (
                    <div className="text-emerald-300 bg-emerald-900/40 px-3 py-1 rounded border border-emerald-500/50 uppercase tracking-widest text-sm shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                        Slow Motion {(activeEffects.slow / 1000).toFixed(1)}s
                    </div>
                )}
                {activeEffects.multiplier > 0 && (
                    <div className="text-purple-300 bg-purple-900/40 px-3 py-1 rounded border border-purple-500/50 uppercase tracking-widest text-sm shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                        2x Score {(activeEffects.multiplier / 1000).toFixed(1)}s
                    </div>
                )}
            </div>
        )}

        {/* Header HUD */}
        {(gameState === 'playing' || gameState === 'levelcomplete') && (
            <div className="flex justify-between items-start p-4 md:p-6 border-b border-emerald-500/30 relative">
                <div className="flex gap-8">
                    <div>
                        <div className="text-xs text-emerald-500/70 uppercase tracking-widest mb-1">Score</div>
                        <div className="text-2xl font-bold text-emerald-400">{stats.score.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs text-emerald-500/70 uppercase tracking-widest mb-1">Combo</div>
                        <div className={`text-2xl font-bold ${stats.combo > 5 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                            {stats.combo}x
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <button 
                        onClick={() => {
                            statsRef.current.endTime = Date.now();
                            setStats({ ...statsRef.current });
                            setGameState('gameover');
                            playGameOverSound();
                        }}
                        className="px-4 py-1.5 border border-red-500/50 text-red-500 bg-red-950/30 rounded uppercase text-[10px] tracking-widest hover:bg-red-500/20 hover:text-white transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                    >
                        Quit Game
                    </button>
                    <button 
                        onClick={() => setShowSettingsModal(true)}
                        className="px-4 py-1.5 border border-emerald-500/50 text-emerald-500 bg-emerald-950/30 rounded uppercase text-[10px] tracking-widest hover:bg-emerald-500/20 hover:text-white transition-all"
                    >
                        Settings
                    </button>
                </div>

                <div className="flex flex-col items-end">
                    <div className="text-xs text-emerald-500/70 uppercase tracking-widest mb-1">Wave</div>
                    <div className="flex items-center gap-4 text-2xl font-bold text-emerald-400">
                        <span>{stats.wave}</span>
                    </div>
                </div>
            </div>
        )}

        {/* Game Area */}
        <div className="flex-1 relative overflow-hidden">
            
            {/* Enemies */}
            {(gameState === 'playing' || gameState === 'levelcomplete' || gameState === 'gameover') && 
              enemies.map(en => (
                <div 
                    key={en.id}
                    id={`enemy-${en.id}`}
                    className={`absolute -translate-x-1/2 transition-shadow`}
                    style={{ left: `${en.x}%`, top: `${en.y}%` }}
                >
                    <div className={`relative px-3 py-1 text-lg md:text-xl tracking-wider font-bold transition-all duration-100 ease-out
                        ${targetId === en.id 
                            ? 'scale-125 z-20' 
                            : en.powerUpType === 'nuke'
                                ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)] z-10 animate-[pulse_2s_infinite]'
                                : en.powerUpType === 'slow'
                                    ? 'text-emerald-300 drop-shadow-[0_0_5px_rgba(110,231,183,0.8)] z-10 animate-[pulse_2s_infinite]'
                                    : en.powerUpType === 'multiplier'
                                        ? 'text-purple-300 drop-shadow-[0_0_5px_rgba(216,180,254,0.8)] z-10 animate-[pulse_2s_infinite]'
                                        : 'text-emerald-400 drop-shadow-[0_0_2px_rgba(16,185,129,0.4)] z-10'
                        }
                    `}>
                        {/* Target Reticle */}
                        {targetId === en.id && (
                            <>
                                <motion.div 
                                    className="absolute -inset-2 border border-emerald-400/50 rounded pointer-events-none" 
                                    animate={{ rotate: 360, scale: [1, 1.05, 1] }} 
                                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                                >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_5px_#34d399]"></div>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_5px_#34d399]"></div>
                                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_5px_#34d399]"></div>
                                    <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_5px_#34d399]"></div>
                                </motion.div>
                                <div className="absolute -inset-1 bg-emerald-500/10 rounded pointer-events-none blur-sm"></div>
                            </>
                        )}
                        {/* Render typed part and untyped part */}
                        <span className={targetId === en.id ? "text-emerald-200 drop-shadow-[0_0_8px_#6ee7b7] bg-emerald-900/30 px-0.5 rounded" : "text-white bg-emerald-500/20 px-0.5 rounded"}>{en.typed}</span>
                        <span className="opacity-80">
                            {en.id === suggestedTarget?.id ? (
                                <>
                                    <span className="text-yellow-200 animate-pulse bg-yellow-200/20 px-0.5 rounded mr-[1px]">{en.word.charAt(0)}</span>
                                    <span>{en.word.slice(1)}</span>
                                </>
                            ) : (
                                en.word.slice(en.typed.length)
                            )}
                        </span>
                    </div>
                </div>
            ))}

            {/* Projectiles */}
            {(gameState === 'playing' || gameState === 'levelcomplete' || gameState === 'gameover') &&
                projectiles.map(proj => {
                    const dx = proj.targetX - proj.x;
                    const dy = proj.targetY - proj.y;
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
                    return (
                        <div 
                            key={proj.id}
                            className="absolute w-1.5 h-6 bg-yellow-300 shadow-[0_0_12px_#fde047] z-10 rounded-full"
                            style={{ 
                                left: `${proj.x}%`, 
                                top: `${proj.y}%`,
                                transform: `translate(-50%, -50%) rotate(${angle}deg)`
                            }}
                        />
                    );
                })
            }

            {/* Particles */}
            {particles.map(p => (
                <div 
                    key={p.id}
                    className="absolute rounded-full z-10 pointer-events-none"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        opacity: p.life / p.maxLife,
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            ))}

            {/* Floating Texts */}
            {floatingTexts.map(ft => (
                <div
                    key={ft.id}
                    className="absolute font-black tracking-widest text-xl z-30 pointer-events-none uppercase transition-opacity"
                    style={{
                        left: `${ft.x}%`,
                        top: `${ft.y}%`,
                        color: ft.color,
                        opacity: ft.life / 1000, // life goes from 1000 to 0
                        textShadow: `0 0 10px ${ft.color}`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {ft.text}
                </div>
            ))}

            {/* Gun turret */}
            {(gameState === 'playing' || gameState === 'levelcomplete' || gameState === 'gameover') && (() => {
                let gunAngle = 0;
                if (targetId) {
                    const target = enemies.find(e => e.id === targetId);
                    if (target) {
                        const dx = target.x - 50;
                        const dy = target.y - 100;
                        gunAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
                    }
                }
                return (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                        {/* Rotating Barrel */}
                        <div 
                            className="relative w-6 h-20 origin-bottom transition-transform duration-75 ease-out"
                            style={{ transform: `rotate(${gunAngle}deg)` }}
                        >
                            <div id="gun-barrel" className="absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-16 bg-gradient-to-t from-emerald-800 to-emerald-500 rounded-t-lg border-x-2 border-t-2 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-transform duration-75">
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-2 bg-emerald-300 rounded shadow-[0_0_10px_#6ee7b7]" />
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-2 h-8 bg-emerald-900 rounded-full" />
                            </div>
                        </div>

                        {/* Turret Base */}
                        <div className="w-28 h-12 bg-gradient-to-t from-gray-900 to-gray-800 rounded-t-full border-t-4 border-emerald-500 shadow-[0_-5px_20px_rgba(0,0,0,0.8)] -mt-8 flex justify-center items-end pb-2">
                             <div className="w-14 h-6 bg-emerald-900/50 rounded-t-full border-t-2 border-emerald-500 shadow-[0_0_15px_#10b981]" />
                        </div>
                    </div>
                );
            })()}

        </div>
        
        {/* Bottom Current Input HUD */}
        {(gameState === 'playing' || gameState === 'levelcomplete') && (
            <div className="h-24 p-6 border-t border-emerald-500/30 flex justify-center items-center">
                {currentInput ? (
                    <div className="text-4xl text-yellow-300 tracking-[0.2em] uppercase font-bold drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]">
                        {currentInput}
                    </div>
                ) : (
                    <div className="text-xl text-emerald-500/30 uppercase tracking-widest animate-pulse">
                        Waiting for input...
                    </div>
                )}
            </div>
        )}

        {/* Menus Overlays */}
        <AnimatePresence>
        {gameState === 'menu' && !showNameModal && !showCustomWordsModal && !showSettingsModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-50">
                <h1 className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600 mb-2 drop-shadow-[0_5px_15px_rgba(16,185,129,0.4)]">
                    LETTER<span className="text-white">STORM</span>
                </h1>
                <p className="text-emerald-500/70 tracking-widest uppercase mb-12">A fun typing game!</p>

                <div className="flex gap-4 mb-6 w-full max-w-md">
                    <button 
                        onClick={() => setAimAssist(!aimAssist)}
                        className={`flex-1 flex flex-col py-2 font-bold uppercase tracking-widest transition-all rounded border-2 ${
                            aimAssist 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                : 'bg-transparent text-red-500/70 border-red-500/30 hover:border-red-500'
                        }`}
                    >
                        <span className="text-xs opacity-70">Aim Assist</span>
                        <span>{aimAssist ? 'ON' : 'OFF'}</span>
                    </button>
                    <button 
                        onClick={() => setShowCustomWordsModal(true)}
                        className="flex-1 flex flex-col py-2 font-bold uppercase tracking-widest transition-all rounded border-2 bg-transparent text-emerald-500/80 border-emerald-500/40 hover:border-emerald-500"
                    >
                         <span className="text-xs opacity-70">Words</span>
                         <span>Custom</span>
                    </button>
                    <button 
                        onClick={() => setShowSettingsModal(true)}
                        className="flex-1 flex flex-col py-2 font-bold uppercase tracking-widest transition-all rounded border-2 bg-transparent text-emerald-400/80 border-emerald-500/40 hover:border-emerald-400 hover:text-emerald-300"
                    >
                        <span className="text-xs opacity-70">Audio & UI</span>
                        <span>Settings</span>
                    </button>
                </div>

                <div className="flex gap-4 w-full max-w-md">
                    {(['easy', 'medium', 'hard'] as const).map(diff => (
                        <button
                            key={diff}
                            onClick={() => setDifficulty(diff)}
                            className={`flex-1 py-3 font-bold uppercase tracking-[0.1em] text-sm transition-all rounded border-2 ${
                                difficulty === diff 
                                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.6)] scale-105' 
                                    : 'bg-transparent text-emerald-500/70 border-emerald-500/30 hover:border-emerald-500'
                            }`}
                        >
                            {diff}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => {
                        if (!playerName || playerName.trim() === '') {
                            setShowNameModal(true);
                        } else {
                            startGame();
                        }
                    }}
                    className="mt-8 px-12 py-5 bg-emerald-500 text-black font-black text-2xl uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-[0_0_30px_rgba(16,185,129,0.6)] rounded border-2 border-transparent hover:border-emerald-400"
                >
                    Start Game
                </button>
                
                <div className="mt-12 text-sm text-emerald-500/70 max-w-md text-center p-6 border border-emerald-500/20 rounded-xl bg-emerald-950/20">
                    <p className="mb-3 uppercase tracking-widest text-emerald-400 font-bold">How to Play</p>
                    <p className="leading-relaxed mb-4">Type the words attached to the falling signals to destroy them. Collect power-ups by destroying special units. Don't let them reach the bottom!</p>
                    <div className="flex flex-col gap-2 text-xs border-t border-emerald-500/20 pt-4">
                        <div className="flex justify-between items-center"><span className="text-white bg-emerald-900/50 px-2 py-1 rounded">Escape</span><span>Clear current target</span></div>
                        <div className="flex justify-between items-center"><span className="text-white bg-emerald-900/50 px-2 py-1 rounded">Backspace</span><span>Clear all typed characters</span></div>
                    </div>
                </div>
            </motion.div>
        )}

        {showNameModal && gameState === 'menu' && (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-50">
                 <div className="w-full max-w-md p-8 bg-emerald-950/30 border-2 border-emerald-500/30 rounded-xl flex flex-col items-center">
                    <h2 className="text-3xl font-black italic text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">ENTER YOUR NAME</h2>
                    <input 
                        type="text" 
                        placeholder="ENTER NAME" 
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                        maxLength={15}
                        className="w-full mb-8 bg-black/80 border-2 border-emerald-500/50 rounded-lg px-6 py-4 text-center text-2xl text-white placeholder-emerald-700/50 focus:outline-none focus:border-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)] font-mono uppercase tracking-widest"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (playerName.trim() === '') setPlayerName('GUEST');
                                setShowNameModal(false);
                                startGame();
                            }
                        }}
                    />
                    <button 
                        onClick={() => {
                            if (playerName.trim() === '') setPlayerName('GUEST');
                            setShowNameModal(false);
                            startGame();
                        }}
                        className="w-full py-4 bg-emerald-500 text-black font-bold text-xl uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] rounded"
                    >
                        PLAY NOW
                    </button>
                 </div>
             </motion.div>
        )}

        {showCustomWordsModal && gameState === 'menu' && (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-50">
                 <div className="w-full max-w-lg p-8 bg-emerald-950/30 border-2 border-emerald-500/30 rounded-xl flex flex-col items-center">
                    <h2 className="text-2xl font-black italic text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">CUSTOM WORDS</h2>
                    <p className="text-emerald-500/70 text-sm mb-6 text-center uppercase tracking-wider">Paste your words separated by spaces or commas</p>
                    <textarea 
                        value={customWordsInput}
                        onChange={(e) => setCustomWordsInput(e.target.value)}
                        placeholder="cat dog mouse apple tree..."
                        className="w-full h-48 mb-6 bg-black/80 border-2 border-emerald-500/50 rounded-lg px-4 py-4 text-emerald-400 placeholder-emerald-700/50 focus:outline-none focus:border-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)] font-mono resize-none leading-relaxed"
                    />
                    <div className="flex gap-4 w-full">
                        <button 
                            onClick={() => setShowCustomWordsModal(false)}
                            className="flex-1 py-4 bg-transparent border-2 border-red-500/50 text-red-400 font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all rounded"
                        >
                            CANCEL
                        </button>
                        <button 
                            onClick={() => {
                                const parsedWords = customWordsInput
                                    .split(/[\s,]+/)
                                    .map(w => w.trim().toLowerCase())
                                    .filter(w => /^[a-z]+$/.test(w));
                                
                                if (parsedWords.length > 0) {
                                    words.custom = Array.from(new Set(parsedWords)); // Update imported object directly
                                } else {
                                    words.custom = []; // clear if empty
                                }
                                setShowCustomWordsModal(false);
                            }}
                            className="flex-1 py-4 bg-emerald-500 text-black font-bold uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] rounded"
                        >
                            SAVE & PLAY
                        </button>
                    </div>
                 </div>
             </motion.div>
        )}

        {showSettingsModal && (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-50">
                 <div className="w-full max-w-md p-8 bg-emerald-950/30 border-2 border-emerald-500/30 rounded-xl flex flex-col items-center">
                    <h2 className="text-3xl font-black italic text-emerald-400 mb-8 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">SETTINGS</h2>
                    
                    <div className="w-full mb-6">
                        <div className="flex justify-between text-emerald-400 mb-2 font-bold uppercase tracking-widest text-sm">
                            <span>Music Volume</span>
                            <span>{musicVol}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={musicVol} 
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setMusicVol(val);
                                updateMusicVolume(val);
                            }}
                            className="w-full h-2 bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>
                    
                    <div className="w-full mb-8">
                        <div className="flex justify-between text-emerald-400 mb-2 font-bold uppercase tracking-widest text-sm">
                            <span>SFX Volume</span>
                            <span>{sfxVol}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={sfxVol} 
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setSfxVol(val);
                                updateSfxVolume(val);
                            }}
                            className="w-full h-2 bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>

                    <button 
                        onClick={() => setShowSettingsModal(false)}
                        className="w-full py-4 bg-emerald-500 text-black font-bold text-xl uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] rounded"
                    >
                        CLOSE SETTINGS
                    </button>
                 </div>
             </motion.div>
        )}

        {gameState === 'levelcomplete' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-50">
                <h2 className="text-4xl md:text-6xl font-bold text-emerald-400 mb-4 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">Wave {stats.wave} Complete</h2>
                <div className="flex gap-8 mb-12 text-center text-emerald-300">
                    <div>
                        <div className="text-xs uppercase text-emerald-500/70">Score</div>
                        <div className="text-2xl">{stats.score.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-emerald-500/70">Accuracy</div>
                        <div className="text-2xl">{accuracy}%</div>
                    </div>
                </div>
                <button 
                    onClick={startNextWave}
                    className="px-8 py-4 bg-emerald-500 text-black font-bold text-xl uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                >
                    Start Wave {stats.wave + 1}
                </button>
            </motion.div>
        )}

        {gameState === 'gameover' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-50 text-emerald-400 overflow-y-auto py-10">
                
                <div id="report-card" className="flex flex-col items-center p-8 rounded-xl border-4 relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)]" style={{ backgroundColor: '#020617', borderColor: '#34d399' }}>
                    {/* Background decor for report */}
                    <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.1), transparent 70%)' }}></div>
                    <div className="absolute top-4 left-4 w-[calc(100%-32px)] h-[calc(100%-32px)] border border-emerald-500/30 rounded pointer-events-none z-0"></div>
                    
                    <div className="relative z-10 flex flex-col items-center w-full min-w-[400px]">
                        <div className="flex flex-col items-center gap-1 mb-6">
                            <h2 className="text-5xl md:text-6xl font-black italic text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] tracking-widest">GAME OVER</h2>
                            <p className="tracking-widest uppercase text-emerald-500/70">AGENT COMPROMISED</p>
                        </div>
                        <p className="tracking-widest uppercase mb-8 text-emerald-200">Presented to: <span className="font-bold text-white text-xl">{playerName || 'Guest'}</span></p>
                        
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-2 text-left p-6 border rounded-sm w-full bg-emerald-500/5 border-emerald-500/30">
                            <div className="uppercase text-xs font-bold text-emerald-500/70 tracking-widest">Final Score</div>
                            <div className="text-2xl font-bold text-right text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{stats.score.toLocaleString()}</div>
                            
                            <div className="uppercase text-xs font-bold text-emerald-500/70 tracking-widest">Wave Reached</div>
                            <div className="text-xl font-bold text-right text-emerald-50">{stats.wave}</div>
                            
                            <div className="uppercase text-xs font-bold text-emerald-500/70 tracking-widest">Difficulty</div>
                            <div className="text-xl font-bold text-right capitalize text-emerald-50">{difficulty}</div>
                            
                            <div className="col-span-2 h-px my-2 bg-emerald-500/20"></div>

                            <div className="uppercase text-xs font-bold text-emerald-500/70 tracking-widest">Words Per Minute</div>
                            <div className="text-xl font-bold text-right text-emerald-50">{wpm}</div>
                            
                            <div className="uppercase text-xs font-bold text-emerald-500/70 tracking-widest">Accuracy</div>
                            <div className="text-xl font-bold text-right text-emerald-50">{accuracy}%</div>
                            
                            <div className="uppercase text-xs text-emerald-500/70 tracking-widest pb-1 border-b border-dashed border-emerald-500/20">Correct / Wrongs</div>
                            <div className="text-lg font-bold text-right pb-1 border-b border-dashed border-emerald-500/20">
                                <span className="text-emerald-400">{stats.correctTyped}</span> 
                                <span className="mx-2 text-emerald-500/50">/</span> 
                                <span className="text-rose-400">{stats.totalTyped - stats.correctTyped}</span>
                            </div>

                            <div className="uppercase text-xs text-emerald-500/70 tracking-widest pt-1">Time Played</div>
                            <div className="text-lg font-bold text-right text-emerald-50 pt-1">{mm}:{ss}</div>
                        </div>
                        
                        <div className="mt-6 flex flex-col items-center">
                            <div className="w-16 h-1 bg-emerald-500/50 rounded mb-2"></div>
                            <div className="text-[10px] uppercase tracking-widest text-emerald-500/50">{new Date().toLocaleDateString()} - VERIFIED RESULTS</div>
                        </div>
                    </div>
                </div>

                {/* Social Sharing Section */}
                <div className="mt-8 flex flex-col items-center w-full max-w-[600px]">
                    <div className="text-sm font-bold tracking-widest uppercase mb-4 text-emerald-500/80 flex items-center gap-2">
                        <Share2 className="w-4 h-4" /> Brag About Your Record
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mb-8 w-full">
                        <button 
                            onClick={() => {
                                const text = `I just reached Wave ${stats.wave} in Letterstorm with ${wpm} WPM and ${accuracy}% accuracy! Think you can beat my typing speed?`;
                                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2]/10 text-[#1DA1F2] border border-[#1DA1F2]/50 hover:bg-[#1DA1F2] hover:text-white rounded transition-colors text-sm font-bold tracking-wider"
                        >
                            <Twitter className="w-4 h-4" /> Twitter
                        </button>
                        <button 
                            onClick={() => {
                                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2]/10 text-[#0A66C2] border border-[#0A66C2]/50 hover:bg-[#0A66C2] hover:text-white rounded transition-colors text-sm font-bold tracking-wider"
                        >
                            <Linkedin className="w-4 h-4" /> LinkedIn
                        </button>
                        <button 
                            onClick={() => {
                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/50 hover:bg-[#1877F2] hover:text-white rounded transition-colors text-sm font-bold tracking-wider"
                        >
                            <Facebook className="w-4 h-4" /> Facebook
                        </button>
                        <button 
                            onClick={() => {
                                const text = `I just reached Wave ${stats.wave} in Letterstorm with ${wpm} WPM! Play it here: ${window.location.href}`;
                                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/50 hover:bg-[#25D366] hover:text-white rounded transition-colors text-sm font-bold tracking-wider"
                        >
                            <MessageCircle className="w-4 h-4" /> WhatsApp
                        </button>
                        <button 
                            onClick={() => {
                                const text = `I just reached Wave ${stats.wave} in Letterstorm with ${wpm} WPM and ${accuracy}% accuracy! Think you can beat my typing speed?`;
                                window.open(`https://reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/50 hover:bg-[#FF4500] hover:text-white rounded transition-colors text-sm font-bold tracking-wider"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.505 1.12-.823 2.705-1.378 4.437-1.467l.889-4.167a.343.343 0 0 1 .406-.263l2.88.606a1.25 1.25 0 0 1 1.408-1.716v-.001zm-4.992 5.378c-1.391 0-2.52.885-2.52 1.977 0 1.092 1.129 1.977 2.52 1.977 1.391 0 2.52-.885 2.52-1.977 0-1.092-1.129-1.977-2.52-1.977zm0 1.139c.56 0 1.015.378 1.015.844 0 .466-.455.844-1.015.844-.56 0-1.015-.378-1.015-.844 0-.466.455-.844 1.015-.844z"/></svg>
                            Reddit
                        </button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={downloadReport}
                        className="px-6 py-3 bg-emerald-950/50 text-emerald-400 font-bold text-sm uppercase tracking-widest hover:bg-emerald-500/20 transition-all border border-emerald-500/50 rounded flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download Certificate
                    </button>
                    <button 
                        onClick={startGame}
                        className="px-8 py-3 bg-white text-slate-900 font-bold text-xl uppercase tracking-widest hover:bg-emerald-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] rounded"
                    >
                        Play Again
                    </button>
                    <button 
                        onClick={() => setGameState('menu')}
                        className="px-6 py-3 bg-transparent text-emerald-500 border border-emerald-500/50 font-bold text-sm uppercase tracking-widest hover:bg-emerald-950/50 transition-all rounded"
                    >
                        Main Menu
                    </button>
                </div>
            </motion.div>
        )}
        </AnimatePresence>

      </div>

      {/* Developer Credit */}
      <div className="absolute bottom-4 right-4 z-[60] text-xs font-mono text-emerald-500/50 hover:text-emerald-400 transition-colors pointer-events-auto">
          <a href="https://linkedin.com/in/usamaalipk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 group">
              <span className="opacity-50">Developed by</span>
              <span className="font-bold underline decoration-emerald-500/30 underline-offset-2 group-hover:decoration-emerald-400">Usama Ali</span>
          </a>
      </div>
    </div>
  );
}
