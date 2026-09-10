import React, { useEffect, useRef, useState } from "react";
import { Sparkles, TrainFront } from "lucide-react";

export default function Loader({
  durationMs = 5000,
  onComplete,
  brandText = "SMART RAIL"
}) {
  const loaderRef = useRef(null);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [wavePhase, setWavePhase] = useState(0);

  // 1. Smooth 5.0-second progressive timer
  useEffect(() => {
    const startTime = performance.now();
    let animationFrameId;

    const updateTimer = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(100, (elapsed / durationMs) * 100);
      setDisplayedProgress(progress);
      setWavePhase((prev) => (prev + 0.08) % (Math.PI * 4));

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

  // 3. Dynamic Wave Math (Rising liquid from 100% to 0% with dual wave oscillation)
  const waterLevel = 100 - displayedProgress;
  const isMid = displayedProgress > 2 && displayedProgress < 98;
  const waveAmp = isMid ? 5.5 : 0;
  const bottomAmp = isMid ? 3.5 : 0;

  // Primary top rising wave
  const t0 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 0) * waveAmp));
  const t1 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 1.2) * waveAmp));
  const t2 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 2.4) * waveAmp));
  const t3 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 3.6) * waveAmp));
  const t4 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 4.8) * waveAmp));
  const t5 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 6.0) * waveAmp));
  const t6 = Math.min(100, Math.max(0, waterLevel + Math.sin(wavePhase + 7.2) * waveAmp));

  // Secondary counter-sliding wave
  const s0 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.3 + 0) * waveAmp));
  const s1 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.3 + 1.2) * waveAmp));
  const s2 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.3 + 2.4) * waveAmp));
  const s3 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.3 + 3.6) * waveAmp));
  const s4 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.3 + 4.8) * waveAmp));
  const s5 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.3 + 6.0) * waveAmp));
  const s6 = Math.min(100, Math.max(0, waterLevel + Math.cos(wavePhase * 1.3 + 7.2) * waveAmp));

  // Dynamic bottom ripple oscillation
  const b0 = 100 - (isMid ? Math.sin(wavePhase * 0.8 + 0) * bottomAmp : 0);
  const b1 = 100 - (isMid ? Math.sin(wavePhase * 0.8 + 1.5) * bottomAmp : 0);
  const b2 = 100 - (isMid ? Math.sin(wavePhase * 0.8 + 3.0) * bottomAmp : 0);
  const b3 = 100 - (isMid ? Math.sin(wavePhase * 0.8 + 4.5) * bottomAmp : 0);
  const b4 = 100 - (isMid ? Math.sin(wavePhase * 0.8 + 6.0) * bottomAmp : 0);

  // Main liquid body clipPath (fills from bottom to top wave)
  const primaryWaveClip = `polygon(
    0% ${t0.toFixed(2)}%, 16% ${t1.toFixed(2)}%, 33% ${t2.toFixed(2)}%, 50% ${t3.toFixed(2)}%, 66% ${t4.toFixed(2)}%, 83% ${t5.toFixed(2)}%, 100% ${t6.toFixed(2)}%,
    100% ${b4.toFixed(2)}%, 75% ${b3.toFixed(2)}%, 50% ${b2.toFixed(2)}%, 25% ${b1.toFixed(2)}%, 0% ${b0.toFixed(2)}%
  )`;

  // Secondary layer clipPath (creates dual-sliding wave depth)
  const secondaryWaveClip = `polygon(
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
          background: radial-gradient(circle at center, #222222 0%, #161616 65%, #0D0D0D 100%);
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

        /* Ambient golden radial aura */
        .loader-ambient-glow {
          position: absolute;
          width: 500px;
          height: 180px;
          background: radial-gradient(ellipse at center, rgba(242, 183, 89, 0.18) 0%, rgba(242, 183, 89, 0.05) 50%, transparent 75%);
          pointer-events: none;
          filter: blur(20px);
        }

        .loader-text-wrapper {
          position: relative;
          display: inline-block;
        }

        /* Base Muted Ghost Text */
        .loader-text-base {
          font-size: clamp(3rem, 7.5vw, 5.5rem);
          font-weight: 900;
          letter-spacing: 0.16em;
          color: rgba(255, 255, 255, 0.12);
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
        }

        /* Primary Dynamic Liquid Wave Fill */
        .loader-text-primary-wave {
          position: absolute;
          inset: 0;
          font-size: clamp(3rem, 7.5vw, 5.5rem);
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
          color: #F2B759;
          text-shadow: 0 0 25px rgba(242, 183, 89, 0.6), 0 0 60px rgba(242, 183, 89, 0.3);
          clip-path: ${primaryWaveClip} !important;
          transition: clip-path 0.02s linear;
          z-index: 2;
        }

        /* Secondary Translucent Counter-Sliding Wave Fill */
        .loader-text-secondary-wave {
          position: absolute;
          inset: 0;
          font-size: clamp(3rem, 7.5vw, 5.5rem);
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
          color: #FFD285;
          opacity: 0.6;
          clip-path: ${secondaryWaveClip} !important;
          transition: clip-path 0.02s linear;
          z-index: 1;
        }

        /* Top & Bottom Sliding Crest Highlights */
        .loader-text-crest {
          position: absolute;
          inset: 0;
          font-size: clamp(3rem, 7.5vw, 5.5rem);
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
          color: #FFFFFF;
          opacity: 0.9;
          clip-path: polygon(
            0% ${Math.min(100, t0 + 1)}%, 100% ${Math.min(100, t6 + 1)}%,
            100% ${Math.min(100, t6 + 3.5)}%, 0% ${Math.min(100, t0 + 3.5)}%
          );
          filter: drop-shadow(0 0 8px #FFFFFF);
          z-index: 3;
          pointer-events: none;
        }

        .loader-progress-wrap {
          margin-top: 36px;
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
          {/* 1. Muted Background Text */}
          <h1 className="loader-text-base">{brandText}</h1>

          {/* 2. Secondary Sliding Wave Layer */}
          <div className="loader-text-secondary-wave" aria-hidden="true">{brandText}</div>

          {/* 3. Primary Liquid Wave Body Fill (Top & Bottom sliding curves) */}
          <div className="loader-text-primary-wave" aria-hidden="true">{brandText}</div>

          {/* 4. Radiant Crest Light Beam */}
          <div className="loader-text-crest" aria-hidden="true">{brandText}</div>
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
          <span>Dual-Wave Synthesis · 5.0s</span>
        </div>
      </div>
    </div>
  );
}
