import React from "react";

const CookieLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 select-none">
      <div className="casino-loader-wrapper">
        {/* Outer rotating roulette gold ring */}
        <div className="casino-roulette-ring"></div>
        {/* Middle counter-rotating dashed chip border */}
        <div className="casino-chip-inner"></div>
        {/* Center glowing emblem with cycling suits */}
        <div className="casino-center-core">
          <span className="casino-suit suit-spade">♠</span>
          <span className="casino-suit suit-heart">♥</span>
          <span className="casino-suit suit-diamond">♦</span>
          <span className="casino-suit suit-club">♣</span>
        </div>
        {/* Orbiting roulette ball */}
        <div className="casino-ball-orbit">
          <div className="casino-ball"></div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-bold tracking-[0.28em] uppercase bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300 bg-clip-text text-transparent animate-pulse">
          CASINO ROYALE
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce"></span>
        </div>
      </div>
    </div>
  );
};

export default CookieLoader;
