import type { MapperCtx } from './runtime';
export function createRenderThrottle(ctx: MapperCtx){
  function nowMs(): number { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function recordRenderTimestamp(): void { const rt=ctx.runtime; const t=nowMs(); rt.recentRenderTimestamps.push(t); while(rt.recentRenderTimestamps.length && t-rt.recentRenderTimestamps[0]>1500) rt.recentRenderTimestamps.shift(); }
  function shouldAbortRenderCycle(_key:string): boolean { const rt=ctx.runtime; const t=nowMs(); if (t<rt.suppressRendersUntil) return true; if (rt.totalRenderAttempts > rt.MAX_TOTAL_RENDERS) return true; const recent=rt.recentRenderTimestamps.filter((ts:number)=> t-ts<=1000); if (recent.length>=rt.MAX_RENDERS_PER_SEC){ rt.suppressRendersUntil = t+400; return true; } return false; }
  return { nowMs, recordRenderTimestamp, shouldAbortRenderCycle };
}
