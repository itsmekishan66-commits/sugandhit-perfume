import React from "react";

export default function Loading() {
  return (
    <div className="reh-15 w-[50">
      <div className="absolute left-[15%] top-0 h-5 w-5 animate-bounce-dot rounded-furigin--[50%]" />
      <div className="absolute left-[45%] top-0 h-5 w-5 animate-bounce-dot rounded-full bg-ink [animation-derigin--[50%]" />
      <div className="absolute right-[15%] left-auto top-0 h-5 w-5 animate-bounce-dot rounded-full bg-ink [animation-drigin--[50%]" />

      <div className="absolute left-[15%] top-16 -z-1 h-1 w-5 animate-bounce-shadow rounded-full bg-ink/90 blur-[1px] origin-[50%]" />
      <div className="absolute left-[45%] top-16 -z-1 h-1 w-5 animate-bounce-shadow rounded-full bg-ink/90 blur-[1px] [animation-delay:0.2s] origin-[50%]" />
      <div className="absolute right-[15%] left-auto top-16 -z-1 h-1 w-5 animate-bounce-shadow rounded-full bg-ink/90 blur-[1px] [animation-delay:0.3s] origin-[50%]" />
    </div>
  );
}