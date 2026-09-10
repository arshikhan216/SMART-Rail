import React, { useEffect, useRef, useState } from "react";
import { Sparkles, BrainCircuit } from "lucide-react";

export default function Loader({ actualProgress = 100, onComplete, brandLeft = "SMART", brandRight = "RAIL" }) {
  const loaderRef = useRef(null);
  const [displayedProgress, setDisplayedProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedProgress((prev) => {
        const next = prev + 1.25;
        if (next > actualProgress) {
          return prev;
        }
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 25);
    return () => clearInterval(interval);
  }, [actualProgress]);

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

  const waterLevel = 100 - displayedProgress;
  const wave1 = displayedProgress > 5 && displayedProgress < 95 ? 5 : 0;
  const wave2 = displayedProgress > 5 && displayedProgress < 95 ? -3 : 0;
  const clipPath = `polygon(0% ${waterLevel}%, 15% ${waterLevel + wave2}%, 30% ${waterLevel + wave1}%, 45% ${waterLevel + wave2}%, 60% ${waterLevel + wave1}%, 75% ${waterLevel + wave2}%, 100% ${waterLevel}%, 100% 100%, 0% 100%)`;

  const getStatusText = (progress) => {
    if (progress < 25) return "Ingesting RKMP-BPL Quad-Track Telemetry...";
    if (progress < 50) return "Evaluating Asset Health & Ultrasonic Flaw Vectors...";
    if (progress < 75) return "Computing Multi-Factor Priority & Duration Quantiles...";
    if (progress < 95) return "Solving CP-SAT Joint Possession Schedule...";
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
          background: linear-gradient(135deg, #1C1C1C 0%, #252525 50%, #171717 100%);
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
          gap: 16px;
          user-select: none;
        }

        .loader-text {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 900;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.15);
          position: relative;
          text-transform: uppercase;
          margin: 0;
        }

        .loader-text::before {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          color: #F2B759;
          text-shadow: 0 0 35px rgba(242, 183, 89, 0.45);
          animation: none !important;
          clip-path: ${clipPath} !important;
          transition: clip-path 0.05s linear;
        }

        .loader-logo-wrap {
          width: clamp(60px, 9vw, 95px);
          height: clamp(60px, 9vw, 95px);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .loader-logo-wrap svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 20px rgba(242, 183, 89, 0.35));
        }

        .loader-progress-wrap {
          margin-top: 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          max-width: 380px;
          width: 90%;
        }

        .loader-bar-bg {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          overflow: hidden;
          position: relative;
        }

        .loader-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #F2B759, #FFD085);
          border-radius: 9999px;
          transition: width 0.05s linear;
          box-shadow: 0 0 12px rgba(242, 183, 89, 0.6);
        }

        .loader-meta {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 11px;
          color: rgba(242, 239, 231, 0.7);
        }

        .loader-status-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #F2B759;
          font-family: ui-monospace, monospace;
        }
      `}</style>

      {/* Subtle background ambient pulse */}
      <div className="absolute w-96 h-96 rounded-full bg-[#F2B759]/5 blur-3xl pointer-events-none animate-pulse" />

      <div className="loader-main">
        <h1 className="loader-text loader-left" data-text={brandLeft}>{brandLeft}</h1>
        
        <div className="loader-logo-wrap">
          <svg viewBox="75 55 300 340" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
            <polygon fill="#F2B759" points="198,116 195,120 188,122 180,124 168,126 157,128 153,130 150,132 148,134 145,136 143,138 140,140 138,142 136,146 136,148 225,148 225,138 225,134 224,132 222,130 218,128 214,126 211,124 204,120"/>
            <polygon fill="#F2B759" points="249,126 255,126 263,126 267,126 268,128 269,130 269,132 295,132 296,134 295,136 295,138 295,148 241,148 241,138 241,136 243,132 245,130 247,128"/>
            <polygon fill="#F2B759" points="143,138 140,140 138,142 136,146 135,150 134,154 133,158 132,162 131,166 130,170 129,174 128,176 126,180 125,184 126,186 128,190 130,196 132,200 134,204 136,206 138,210 140,214 142,216 144,218 149,220 155,222 160,224 165,226 171,228 295,228 300,226 305,224 310,220 310,216 306,212 301,208 294,204 304,200 307,196 309,192 311,188 313,184 314,180 315,176 314,172 313,168 310,164 307,160 303,156 299,152 295,148 293,144 291,140 291,138"/>
            <polygon fill="#1C1C1C" points="176,170 173,172 160,176 164,178 166,180 169,182 171,184 173,186 186,188 201,190 205,192 208,194 210,196 212,198 214,200 215,202 217,204 218,206 220,208 222,210 223,212 225,214 225,216 220,218 212,220 203,222 196,224 189,226 180,228 250,228 247,226 245,224 244,222 242,220 241,218 239,216 238,214 237,212 236,210 234,208 232,206 231,204 230,202 229,200 228,198 227,196 226,194 225,190 223,188 222,186 221,184 220,182 219,180 217,178 215,176 213,174 200,172 189,172"/>
            <polygon fill="#1C1C1C" points="271,174 288,174 298,174 303,176 301,178 300,180 299,182 298,184 298,186 297,188 297,190 296,192 296,194 296,196 299,198 303,200 293,200 290,198 288,196 285,194 284,192 283,190 281,188 280,186 276,184 275,182 274,180 272,178 271,176"/>
            <polygon fill="#F2B759" points="228,242 238,242 246,244 254,248 260,252 265,256 270,260 274,264 277,268 278,272 277,276 274,280 269,284 263,288 256,292 249,296 242,300 235,304 228,304 225,300 222,296 220,292 218,288 214,284 211,280 210,276 210,272 210,268 210,264 212,260 215,256 218,252 221,248"/>
            <polygon fill="#F2B759" points="309,232 313,232 316,234 317,238 318,242 318,246 318,250 319,254 319,258 319,262 319,266 319,270 318,274 316,278 313,282 310,284 306,282 302,278 299,274 297,270 294,266 294,262 294,258 295,254 297,250 299,246 302,242 305,238 307,234"/>
            <polygon fill="#F2B759" points="259,306 309,306 311,310 312,314 313,318 312,322 311,326 308,330 304,334 298,338 291,342 289,344 280,342 273,338 264,334 257,330 252,326 250,322 249,318 249,314 251,310"/>
          </svg>
        </div>

        <h1 className="loader-text loader-right" data-text={brandRight}>{brandRight}</h1>
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
          <span className="font-bold text-[#F2B759]">{Math.floor(displayedProgress)}%</span>
        </div>
      </div>
    </div>
  );
}
