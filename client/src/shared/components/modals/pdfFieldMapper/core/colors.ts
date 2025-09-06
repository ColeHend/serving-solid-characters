// Convert hex color (#rgb or #rrggbb) to 0-1 component object
export function hexToRgb01(hex: string) {
  const raw = hex.replace('#','');
  if (raw.length === 3) { 
    const r = parseInt(raw[0]+raw[0],16); const g = parseInt(raw[1]+raw[1],16); const b = parseInt(raw[2]+raw[2],16); 
    return { r:r/255,g:g/255,b:b/255 }; 
  }
  const r = parseInt(raw.slice(0,2),16); const g = parseInt(raw.slice(2,4),16); const b = parseInt(raw.slice(4,6),16); 
  return { r:r/255,g:g/255,b:b/255 };
}
