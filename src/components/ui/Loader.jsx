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

  // 1. Precise 5.0-second progressive timer (0% to 100%)
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

  // 3. SVG Dimensions & Liquid Rise Math
  const svgWidth = 900;
  const svgHeight = 140;
  
  // waterY starts at svgHeight (140 = 0% filled at bottom) and moves up to 0 (100% filled at top)
  const waterY = svgHeight - (displayedProgress / 100) * svgHeight;
  const isMid = displayedProgress > 0.5 && displayedProgress < 99.5;
  const waveAmp = isMid ? 5.5 : 0;

  // Generate primary undulating wave curve along the liquid surface
  const wavePoints = [];
  const crestPoints = [];
  for (let x = 0; x <= svgWidth; x += 25) {
    const y = Math.min(svgHeight, Math.max(0, waterY + Math.sin((x / 65) + wavePhase) * waveAmp));
    wavePoints.push(`${x},${y.toFixed(2)}`);
    crestPoints.push(`${x},${(y).toFixed(2)}`);
  }

  // Secondary counter-phase wave points
  const secWavePoints = [];
  for (let x = 0; x <= svgWidth; x += 25) {
    const y = Math.min(svgHeight, Math.max(0, waterY + Math.cos((x / 55) - wavePhase * 1.2) * (waveAmp * 0.75)));
    secWavePoints.push(`${x},${y.toFixed(2)}`);
  }

  // Complete solid liquid body path: Top wave line -> Bottom right -> Bottom left -> Close
  const primaryLiquidPath = `M 0,${svgHeight} L 0,${waterY.toFixed(2)} L ${wavePoints.join(" L ")} L ${svgWidth},${svgHeight} Z`;
  const secondaryLiquidPath = `M 0,${svgHeight} L 0,${waterY.toFixed(2)} L ${secWavePoints.join(" L ")} L ${svgWidth},${svgHeight} Z`;
  const crestLinePath = `M ${crestPoints.join(" L ")}`;

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
          background: radial-gradient(circle at center, #222222 0%, #171717 65%, #0B0B0B 100%);
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
          width: 92%;
          max-width: 940px;
        }

        /* Ambient golden glow behind text */
        .loader-ambient-glow {
          position: absolute;
          width: 650px;
          height: 220px;
          background: radial-gradient(ellipse at center, rgba(242, 183, 89, 0.22) 0%, rgba(242, 183, 89, 0.06) 50%, transparent 75%);
          pointer-events: none;
          filter: blur(30px);
        }

        .loader-svg-wrap {
          width: 100%;
          height: auto;
          overflow: visible;
          position: relative;
          z-index: 2;
        }

        .loader-progress-wrap {
          margin-top: 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          max-width: 440px;
          width: 90%;
          position: relative;
          z-index: 2;
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

        <svg viewBox="0 0 900 140" className="loader-svg-wrap">
          <defs>
            {/* Text Clip Mask (Masks only the letters SMART RAIL) */}
            <clipPath id="smartrail-text-clip">
              <text
                x="450"
                y="85"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="76"
                fontWeight="900"
                letterSpacing="0.16em"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              >
                {brandText}
              </text>
            </clipPath>

            {/* Glowing Golden Liquid Gradient */}
            <linearGradient id="liquid-gold-grad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#D99736" />
              <stop offset="70%" stopColor="#F2B759" />
              <stop offset="100%" stopColor="#FFE09E" />
            </linearGradient>

            {/* Liquid Surface Glow Filter */}
            <filter id="liquid-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Base Muted Unfilled Text */}
          <text
            x="450"
            y="85"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="76"
            fontWeight="900"
            letterSpacing="0.16em"
            fill="rgba(255, 255, 255, 0.12)"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          >
            {brandText}
          </text>

          {/* 2. Liquid Layer Clipped INSIDE the Text Mask */}
          <g clipPath="url(#smartrail-text-clip)">
            {/* Solid Golden Liquid Base expanding from bottom up */}
            <rect x="0" y={waterY} width={svgWidth} height={svgHeight - waterY} fill="url(#liquid-gold-grad)" />

            {/* Secondary Translucent Counter-Wave */}
            <path d={secondaryLiquidPath} fill="#FFDFA3" opacity="0.4" />

            {/* Primary Undulating Wave Body */}
            <path d={primaryLiquidPath} fill="url(#liquid-gold-grad)" filter="url(#liquid-glow)" />

            {/* Leading Wave Crest Line */}
            {isMid && (
              <path
                d={crestLinePath}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                fill="none"
                opacity="0.9"
                strokeLinecap="round"
              />
            )}
          </g>
        </svg>
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
