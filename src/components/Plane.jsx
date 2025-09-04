import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import planeSvg from "../assets/plane.svg";

// Plane now receives explicit x,y coordinates (px) and angle (deg) computed by GameScreen
export default function Plane({ x = 0, y = 0, angle = 0, phase, multiplier = 1 }) {
  // Responsive plane size (use percent of container width via tailwind classes); fallback px used for motion calc
  const W = 110; // visual size in px when container scales
  const H = 60;

  // CSS filter to tint the SVG to red (#ff0033). If you prefer exact control, inline the SVG.
  const colorFilter = 'invert(17%) sepia(97%) saturate(600%) hue-rotate(-10deg) brightness(95%)';

  // Audio refs
  const audioRef = useRef({ ctx: null, osc: null, gain: null });

  // Initialize audio context and nodes once
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 220;
      gain.gain.value = 0; // start silent
      osc.connect(gain);
      gain.connect(ctx.destination);
      // start oscillator (may be suspended until user gesture)
      try { osc.start(); } catch (e) { /* some browsers require run on user gesture */ }
      audioRef.current = { ctx, osc, gain };
    } catch (err) {
      // audio not available
      audioRef.current = { ctx: null, osc: null, gain: null };
    }

    return () => {
      const { ctx, osc } = audioRef.current;
      try {
        if (osc) osc.stop();
        if (ctx && ctx.close) ctx.close();
      } catch (e) {}
    };
  }, []);

  // Control audio based on phase and multiplier
  useEffect(() => {
    const { ctx, osc, gain } = audioRef.current;
    if (!ctx || !osc || !gain) return;

    const now = ctx.currentTime;

    if (phase === 'RUNNING') {
      // resume context (may require user gesture)
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      // ramp up gain smoothly
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value || 0.0001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.25);
      // frequency mapping
      const base = 220;
      const freq = Math.min(2500, base + (multiplier - 1) * 120);
      osc.frequency.cancelScheduledValues(now);
      osc.frequency.setValueAtTime(osc.frequency.value || base, now);
      osc.frequency.linearRampToValueAtTime(freq, now + 0.15);
    } else {
      // fade out
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value || 0.0001, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
    }
  }, [phase, multiplier]);

  // Play crash blast sound (short noise burst) when crashed
  useEffect(() => {
    const { ctx } = audioRef.current;
    if (!ctx) return;
    if (phase !== 'CRASHED') return;

    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();

    const now = ctx.currentTime;

    // ---- Sub-bass thump (sine oscillator) ----
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(60, now);
    subGain.gain.setValueAtTime(0.0001, now);
    // quick attack to loud thump then decay
    subGain.gain.exponentialRampToValueAtTime(0.9, now + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    try { sub.start(now); sub.stop(now + 0.7); } catch (e) {}

    // ---- Filtered impact noise (body of the blast) ----
    const dur = 0.6;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // white noise shaped with exponential decay
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-4 * (i / bufferSize));
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(600, now);
    noiseFilter.Q.setValueAtTime(0.7, now);
    // sweep down to add punch
    noiseFilter.frequency.exponentialRampToValueAtTime(120, now + 0.35);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(1.0, now + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    try { noiseSrc.start(now); noiseSrc.stop(now + dur + 0.02); } catch (e) {}

    // ---- High-frequency sizzle (short) - boosted for sharper blast ----
    const sizzleDur = 0.22;
    const sizzleBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sizzleDur), ctx.sampleRate);
    const sizzleData = sizzleBuf.getChannelData(0);
    for (let i = 0; i < sizzleData.length; i++) sizzleData[i] = (Math.random() * 2 - 1) * Math.exp(-6 * (i / sizzleData.length));
    const sizzleSrc = ctx.createBufferSource();
    sizzleSrc.buffer = sizzleBuf;
    const sizzleHP = ctx.createBiquadFilter();
    sizzleHP.type = 'highpass';
    sizzleHP.frequency.setValueAtTime(2200, now); // higher cut to emphasize HF
    // small resonant boost to make it more piercing
    const sizzlePeak = ctx.createBiquadFilter();
    sizzlePeak.type = 'peaking';
    sizzlePeak.frequency.setValueAtTime(3500, now);
    sizzlePeak.gain.setValueAtTime(6, now);
    sizzlePeak.Q.setValueAtTime(1.2, now);
    const sizzleGain = ctx.createGain();
    sizzleGain.gain.setValueAtTime(0.0001, now);
    // faster attack and higher peak
    sizzleGain.gain.exponentialRampToValueAtTime(1.0, now + 0.008);
    sizzleGain.gain.exponentialRampToValueAtTime(0.0001, now + sizzleDur);
    sizzleSrc.connect(sizzleHP);
    sizzleHP.connect(sizzlePeak);
    sizzlePeak.connect(sizzleGain);
    sizzleGain.connect(ctx.destination);
    try { sizzleSrc.start(now); sizzleSrc.stop(now + sizzleDur); } catch (e) {}

    // ---- Short HF click/impulse to accentuate the blast transient ----
    try {
      const hf = ctx.createOscillator();
      const hfGain = ctx.createGain();
      hf.type = 'square';
      hf.frequency.setValueAtTime(6000, now);
      hfGain.gain.setValueAtTime(0.0001, now);
      hfGain.gain.exponentialRampToValueAtTime(0.8, now + 0.003);
      hfGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      hf.connect(hfGain);
      hfGain.connect(ctx.destination);
      hf.start(now);
      hf.stop(now + 0.06);
    } catch (e) { /* ignore if oscillator can't start */ }

    // cleanup handled automatically when sources stop
  }, [phase]);

  // Convert percent coords to CSS positioning inside the responsive overlay
  const left = `${x}px`;
  const top = `${y}px`;

  return (
    <motion.div
      className="absolute pointer-events-none w-16 h-9 sm:w-28 sm:h-16"
      style={{ left, top, zIndex: 50, transformOrigin: 'center', transform: 'translate(-50%, -50%)' }}
      animate={{ rotate: angle }}
      transition={{ type: 'spring', stiffness: 90, damping: 24 }}
    >
      <img
        src={planeSvg}
        alt="plane"
        className="w-full h-full object-contain"
        style={{ filter: colorFilter }}
      />
      {phase === 'CRASHED' && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-accent">✸</div>
      )}
    </motion.div>
  );
}

