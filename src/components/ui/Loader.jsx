import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

export default function Loader({
  durationMs = 5000,
  onComplete,
  brandText = "SMART RAIL"
}) {
  const loaderRef = useRef(null);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [wavePhase, setWavePhase] = useState(0);

  // 1. Precise 5.0-second smooth progressive timer (0% to 100%)
  useEffect(() => {
    const startTime = performance.now();
    let animationFrameId;

    const updateTimer = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(100, (elapsed / durationMs) * 100);
      setDisplayedProgress(progress);
      setWavePhase((prev) => (prev + 0.09) % (Math.PI * 4));

      if (progress < 100) {
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    animationFrameId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(animationFrameId);
  }, [durationMs]);

  // 2. Smooth exit trigger upon 100%
  useEffect(() => {
    if (displayedProgress >= 100) {
      if (loaderRef.current) {
        loaderRef.current.classList.add("loader-exit");
        const timer = setTimeout(() => {
          if (loaderRef.current) loaderRef.current.style.display = "none";
          if (onComplete) onComplete();
        }, 750);
        return () => clearTimeout(timer);
      }
    }
  }, [displayedProgress, onComplete]);

  // 3. True Bottom-to-Top Expanding Liquid Wave Fill
  // Water level goes from 100% (empty bottom) down to 0% (fully submerged top)
  const waterLevel = 100 - displayedProgress;
  const isMid = displayedProgress > 1 && displayedProgress < 99;
  const waveAmp = isMid ? 4.5 : 0;

  // Primary rolling wave crest along the top boundary of the liquid
  const t0 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 0) * waveAmp));
  const t1 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 1.1) * waveAmp));
  const t2 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 2.2) * waveAmp));
  const t3 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 3.3) * waveAmp));
  const t4 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 4.4) * waveAmp));
  const t5 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 5.5) * waveAmp));
  const t6 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 6.6) * waveAmp));

  // Secondary translucent ripple layer
  const s0 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.2 + 0) * (waveAmp * 0.8)));
  const s1 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.2 + 1.1) * (waveAmp * 0.8)));
  const s2 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.2 + 2.2) * (waveAmp * 0.8)));
  const s3 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.2 + 3.3) * (waveAmp * 0.8)));
  const s4 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.2 + 4.4) * (waveAmp * 0.8)));
  const s5 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.2 + 5.5) * (waveAmp * 0.8)));
  const s6 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.2 + 6.6) * (waveAmp * 0.8)));

  // Solid Liquid Fill: polygon covers from top wave down to 100% (bottom of letters)
  const primaryLiquidClip = `polygon(
    0% ${t0.toFixed(2)}%, 16% ${t1.toFixed(2)}%, 33% ${t2.toFixed(2)}%, 50% ${t3.toFixed(2)}%, 66% ${t4.toFixed(2)}%, 83% ${t5.toFixed(2)}%, 100% ${t6.toFixed(2)}%,
    100% 100%, 0% 100%
  )`;

  const secondaryLiquidClip = `polygon(
    0% ${s0.toFixed(2)}%, 16% ${s1.toFixed(2)}%, 33% ${s2.toFixed(2)}%, 50% ${s3.toFixed(2)}%, 66% ${s4.toFixed(2)}%, 83% ${s5.toFixed(2)}%, 100% ${s6.toFixed(2)}%,
    100% 100%, 0% 100%
  )`;

  const getStatusText = (progress) => {
    if (progress < 20) return "Ingesting RKMP-BPL Quad-Track Telemetry...";
    if (progress < 40) return "Evaluating Asset Health & Ultrasonic Flaw Vectors...";
    if (progress < 65) return "Computing Multi-Factor Priority & Duration Quantiles...";
    if (progress < 85) return "Solving CP-SAT Joint Possession Schedule...";
    if (progress < 99) return "Calibrating TreeSHAP Feature Attributions...";
    return "SMART-Rail Decision Support Ready";
  };

  return (
    <div id="zorviq-loader" ref={loaderRef} className="smartrail-loader-container">
      <style>{`
        .smartrail-loader-container {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #232323 0%, #171717 65%, #0E0E0E 100%);
          color: #F2EFE7;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .smartrail-loader-container.loader-exit {
          opacity: 0;
          transform: scale(1.04);
          pointer-events: none;
        }

        .loader-main {
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          position: relative;
        }

        /* Ambient golden glow behind text */
        .loader-ambient-glow {
          position: absolute;
          width: 600px;
          height: 220px;
          background: radial-gradient(ellipse at center, rgba(242, 183, 89, 0.22) 0%, rgba(242, 183, 89, 0.06) 50%, transparent 75%);
          pointer-events: none;
          filter: blur(25px);
        }

        .loader-text-wrapper {
          position: relative;
          display: inline-block;
        }

        /* 1. Base Muted Outline Text */
        .loader-text-base {
          font-size: clamp(3.2rem, 8vw, 5.8rem);
          font-weight: 900;
          letter-spacing: 0.16em;
          color: rgba(255, 255, 255, 0.14);
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
        }

        /* 2. Secondary Translucent Liquid Fill Layer */
        .loader-text-secondary-fill {
          position: absolute;
          inset: 0;
          font-size: clamp(3.2rem, 8vw, 5.8rem);
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
          color: #FFDF99;
          opacity: 0.45;
          clip-path: ${secondaryLiquidClip} !important;
          transition: clip-path 0.02s linear;
          z-index: 1;
        }

        /* 3. Primary Solid Golden Liquid Fill (Expands Bottom to Top) */
        .loader-text-primary-fill {
          position: absolute;
          inset: 0;
          font-size: clamp(3.2rem, 8vw, 5.8rem);
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
          color: #F2B759;
          text-shadow: 0 0 30px rgba(242, 183, 89, 0.6), 0 0 60px rgba(242, 183, 89, 0.3);
          clip-path: ${primaryLiquidClip} !important;
          transition: clip-path 0.02s linear;
          z-index: 2;
        }

        /* 4. Radiant Liquid Surface Wave Beam Highlight */
        .loader-text-crest-line {
          position: absolute;
          inset: 0;
          font-size: clamp(3.2rem, 8vw, 5.8rem);
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
          color: #FFFFFF;
          opacity: 0.95;
          clip-path: polygon(
            0% ${Math.min(100, t0)}%, 100% ${Math.min(100, t6)}%,
            100% ${Math.min(100, t6 + 3.5)}%, 0% ${Math.min(100, t0 + 3.5)}%
          );
          filter: drop-shadow(0 0 8px #FFF0D0);
          z-index: 3;
          pointer-events: none;
        }

        .loader-progress-wrap {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          max-width: 440px;
          width: 90%;
        }

        .loader-bar-bg {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          overflow: hidden;
          position: relative;
        }

        .loader-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #F2B759 0%, #FFD085 70%, #FFFFFF 100%);
          border-radius: 9999px;
          box-shadow: 0 0 14px rgba(242, 183, 89, 0.85);
          transition: width 0.02s linear;
        }

        .loader-meta {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 11.5px;
          color: rgba(242, 239, 231, 0.75);
        }

        .loader-status-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #F2B759;
          font-family: ui-monospace, monospace;
        }

        .loader-sliding-rail {
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding-top: 6px;
          border-top: 1px dashed rgba(242, 183, 89, 0.2);
          font-size: 10px;
          font-family: ui-monospace, monospace;
          color: rgba(242, 183, 89, 0.6);
        }
      `}</style>

      <div className="loader-main">
        <div className="loader-ambient-glow" />

        <div className="loader-text-wrapper">
          {/* Base Unfilled Muted Text */}
          <h1 className="loader-text-base">{brandText}</h1>

          {/* Secondary Liquid Wave Depth */}
          <div className="loader-text-secondary-fill" aria-hidden="true">{brandText}</div>

          {/* Primary Golden Liquid Fill (Expands from bottom 100% up to 0%) */}
          <div className="loader-text-primary-fill" aria-hidden="true">{brandText}</div>

          {/* Leading Surface Wave Crest Light Beam */}
          <div className="loader-text-crest-line" aria-hidden="true">{brandText}</div>
        </div>
      </div>

      <div className="loader-progress-wrap">
        <div className="loader-bar-bg">
          <div className="loader-bar-fill" style={{ width: `${displayedProgress}%` }} />
        </div>

        <div className="loader-meta">
          <span className="loader-status-tag">
            <Sparkles className="w-3.5 h-3.5" />
            {getStatusText(displayedProgress)}
          </span>
          <span className="font-bold text-[#F2B759] font-mono">{Math.floor(displayedProgress)}%</span>
        </div>

        <div className="loader-sliding-rail">
          <span>Corridor: RKMP-BPL Quad Track</span>
          <span>Full Liquid Rise · 5.0s</span>
        </div>
      </div>
    </div>
  );
}
