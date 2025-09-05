import React, { useMemo, useEffect } from "react";
import { useGame } from "../context/GameContext.jsx";
import Plane from "./Plane.jsx";
import { useState, useRef } from 'react';

// Visual constants
const RED = '#ff0033';

export default function GameScreen({ onBack }) {
  const { phase, multiplier, countdown, crashPoint,
    growthRate, growthExponent,
    increaseGrowthRate, decreaseGrowthRate,
    increaseGrowthExponent, decreaseGrowthExponent,
    increaseRoundSpeed } = useGame();

  // keyboard bindings for quick speed controls
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '+') increaseGrowthRate(0.05);
      if (e.key === '-') decreaseGrowthRate(0.05);
      if (e.key === '>') increaseGrowthExponent(0.05);
      if (e.key === '<') decreaseGrowthExponent(0.05);
      if (e.key === 's') increaseRoundSpeed(-1); // press 's' to speed rounds (reduce wait)
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [increaseGrowthRate, decreaseGrowthRate, increaseGrowthExponent, decreaseGrowthExponent, increaseRoundSpeed]);

  // Canvas internal viewport used for math. Rendering will be responsive via an aspect-ratio box.
  const viewW = 900;
  const viewH = 300;

  // Generate an exponential-ish path function mapping t in [0,1] -> {x,y}
  const pathPoints = useMemo(() => {
    const points = [];
    const bottomY = viewH - 20; // baseline from bottom
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      // Exponential curve: y = baseline - a * (e^{k*t} - 1)
      const a = 220;
      const k = 3.4; // shape steepness
      const y = bottomY - (a * (Math.exp(k * t) - 1)) / (Math.exp(k) - 1);
      const x = (t * viewW);
      points.push({ x, y });
    }
    return points;
  }, []);

  // Current progress along the path based on multiplier. We'll map 1x -> t=0, and cap t at 0.98 for display.
  const tForMultiplier = Math.min(0.98, Math.log(Math.max(1, multiplier)) / Math.log(Math.max(2, crashPoint.value || 2)) );

  // Compute current plane coordinates and angle from path (in internal viewport units)
  const rawPlanePos = useMemo(() => {
    const idx = Math.floor(tForMultiplier * (pathPoints.length - 1));
    const p = pathPoints[idx] || pathPoints[0];
    const pNext = pathPoints[Math.min(idx + 3, pathPoints.length - 1)] || p;
    const dx = pNext.x - p.x;
    const dy = pNext.y - p.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { x: p.x, y: p.y, angle };
  }, [tForMultiplier, pathPoints]);

  // refs so we can query the actual SVG path and map to screen coordinates
  const svgBoxRef = useRef(null);
  const svgRef = useRef(null);
  const progressPathRef = useRef(null);
  const [planePx, setPlanePx] = useState({ x: 0, y: 0, angle: 0 });

  // map raw internal coords -> pixel coords whenever size or rawPlanePos changes
  useEffect(() => {
    const el = svgBoxRef.current;
    const svgEl = svgRef.current;
    const pathEl = progressPathRef.current;
    if (!el) return;
    const applyMapping = () => {
      try {
        // Prefer direct conversion of internal svg coordinates to screen coordinates.
        if (svgEl && typeof svgEl.createSVGPoint === 'function') {
          const svgPoint = svgEl.createSVGPoint();
          svgPoint.x = rawPlanePos.x;
          svgPoint.y = rawPlanePos.y;
          const screenCTM = svgEl.getScreenCTM();
          if (screenCTM) {
            const screenPt = svgPoint.matrixTransform(screenCTM);
            const rect = el.getBoundingClientRect();
            const x = screenPt.x - rect.left;
            const y = screenPt.y - rect.top;
            setPlanePx({ x, y, angle: rawPlanePos.angle });
            return;
          }
        }
      } catch (e) {
        // fall back to scale mapping below
      }
      // fallback: simple scale mapping
      const rect = el.getBoundingClientRect();
      const scaleX = rect.width / viewW;
      const scaleY = rect.height / viewH;
      const x = rawPlanePos.x * scaleX;
      const y = rawPlanePos.y * scaleY;
      setPlanePx({ x, y, angle: rawPlanePos.angle });
    };
    applyMapping();
    let ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(applyMapping);
      ro.observe(el);
    }
    window.addEventListener('resize', applyMapping);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', applyMapping);
    };
  }, [rawPlanePos, multiplier, crashPoint]);

  // Build SVG path string from points (move to baseline center then follow curve)
  const pathD = useMemo(() => {
    if (!pathPoints.length) return '';
    let d = '';
    // start at left baseline
    d += `M ${0} ${viewH - 10} `;
    // line to first point
    for (let i = 0; i < pathPoints.length; i++) {
      const p = pathPoints[i];
      d += `L ${p.x} ${p.y} `;
    }
    return d;
  }, [pathPoints]);

  // Filled area under the curve up to current progress
  const filledPath = useMemo(() => {
    if (!pathPoints.length) return '';
    const idx = Math.floor(tForMultiplier * (pathPoints.length - 1));
    const slice = pathPoints.slice(0, Math.max(1, idx + 1));
    if (slice.length < 2) return '';
    let s = `M ${slice[0].x} ${viewH - 8} L `;
    s += slice.map(p => `${p.x} ${p.y}`).join(' ');
    s += ` L ${slice[slice.length - 1].x} ${viewH - 8} Z`;
    return s;
  }, [pathPoints, tForMultiplier]);

  // Progressive path (stroke) up to the current plane index for a smooth following line
  const progressPath = useMemo(() => {
    if (!pathPoints.length) return '';
    const idx = Math.max(1, Math.floor(tForMultiplier * (pathPoints.length - 1)));
    const slice = pathPoints.slice(0, idx + 1);
    let s = `M ${slice[0].x} ${slice[0].y} `;
    s += slice.map(p => `L ${p.x} ${p.y} `).join(' ');
    return s;
  }, [pathPoints, tForMultiplier]);

  return (
    <div className="flex-1 bg-gradient-to-b from-panel to-panel-alt rounded-lg border border-gray-800 relative overflow-hidden flex items-center justify-center">
      {/* Back to Dashboard */}
      {onBack && (
        <button onClick={onBack} className="absolute top-4 right-4 z-40 px-3 py-1 bg-panel-alt text-sm rounded-md border border-gray-700 hover:bg-gray-800">Back to Dashboard</button>
      )}
      {/* Waiting Phase */}
      {phase === "WAITING" && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-3xl tracking-wide font-semibold">WAITING FOR NEXT ROUND</div>
          <div className="w-72 h-2 bg-gray-700 rounded overflow-hidden">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${((5 - countdown) / 5) * 100}%` }} />
          </div>
          <div className="text-sm text-gray-400">Starts in {countdown}s</div>
        </div>
      )}

      {/* Active or Crashed: render SVG track + plane */}
      {phase !== 'WAITING' && (
        <div className="absolute inset-0 flex flex-col">
          {/* Multiplier Live Value top-left */}
          <div className="absolute top-4 left-4 text-6xl font-bold tracking-wide text-white drop-shadow-sm z-30">
            {multiplier.toFixed(2)}<span className="text-accent">x</span>
          </div>

          {/* SVG container centered horizontally, anchored to bottom */}
          <div className="w-full flex-1 flex items-end justify-center z-10 pointer-events-none">
            {/* Responsive aspect-box: keeps svg scaled while math still uses internal viewport */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '1000px' }}>
                <div ref={svgBoxRef} style={{ position: 'relative', width: '100%', paddingBottom: `${(viewH / viewW) * 100}%` }}>
                  <svg ref={svgRef} viewBox={`0 0 ${viewW} ${viewH}`} width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', left: 0, top: 0 }}>
              {/* Background grid or rays could go here if desired */}

              {/* (removed fixed background shadow path) */}

              {/* Filled area under curve until current multiplier (semi-transparent) */}
              {multiplier > 1 && filledPath && (
                <path d={filledPath} fill={RED} opacity={0.12} />
              )}

              {/* Progressive stroked path up to plane (border + red line) */}
              {progressPath && (
                <>
                  <path d={progressPath} fill="none" stroke="#1b1d20" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
                  <path ref={progressPathRef} d={progressPath} fill="none" stroke={RED} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}

                  </svg>
                  {/* Render plane absolute on top of svg - using percent coords so it scales on small screens */}
                  <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <Plane x={planePx.x} y={planePx.y} angle={planePx.angle} phase={phase} multiplier={multiplier} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Crash info top-right */}
          <div className="absolute top-6 right-6 text-sm text-gray-400 z-30">
            {phase === "CRASHED" ? `Crash Point: ${crashPoint.value.toFixed(2)}x` : "Crash Point: ???"}
          </div>

          <div className="absolute bottom-4 left-4 text-xs text-gray-500 z-30">Provably Fair (demo)</div>
        </div>
      )}

      {/* Crash overlay message remains centered */}
      {phase === "CRASHED" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="text-5xl font-bold text-accent drop-shadow-lg">CRASHED AT {crashPoint.value.toFixed(2)}x</div>
        </div>
      )}
    </div>
  );
}
