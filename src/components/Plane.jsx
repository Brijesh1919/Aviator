import React from "react";
import { motion } from "framer-motion";
import planeSvg from "../assets/plane.svg";

// Plane now receives explicit x,y coordinates (px) and angle (deg) computed by GameScreen
export default function Plane({ x = 0, y = 0, angle = 0, phase }) {
  // Make plane visibly larger (approx 2x) and remove glow/blur
  const W = 130;
  const H = 72;

  // CSS filter to tint the SVG to red (#ff0033). If you prefer exact control, inline the SVG.
  const colorFilter = 'invert(17%) sepia(97%) saturate(600%) hue-rotate(-10deg) brightness(95%)';

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ width: W, height: H, left: 0, top: 0, zIndex: 50, transformOrigin: 'center' }}
      animate={{ x: x - W / 2, y: y - H / 2, rotate: angle }}
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
