import type { MapperCtx } from './runtime';
export function createPersistence(ctx: MapperCtx){
	const LOCAL_KEY='pdfFieldMappings';
	function exportJson(): void { const plain=ctx.mappings().map(m=> ({ llc:m.llc, urc:m.urc, value:m.key, page:m.page, format:m.format })); const blob=new Blob([JSON.stringify(plain,null,2)], { type:'application/json' }); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='pdf-field-map.json'; a.click(); URL.revokeObjectURL(url); }
	function importJson(ev:Event): void { const input=ev.target as HTMLInputElement; const file=input.files?.[0]; if(!file) return; const readPromise=(file as any).text? (file as any).text(): new Promise<string>((res,rej)=>{ try { const reader=new FileReader(); reader.onerror=()=>rej(reader.error); reader.onload=()=>res(reader.result as string); reader.readAsText(file);} catch(e){rej(e);} }); readPromise.then((txt:string)=> { try { const arr=JSON.parse(txt) as any[]; const drafts=arr.map(a=> ({ ...a, key:a.value })); ctx.setMappings(drafts); if(ctx.pdfDoc()) ctx.runtime.renderPageFromDoc?.(ctx.pdfDoc(), ctx.pageIndex(), ctx.scale()); } catch {} }); }
	function saveMappings(): void { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(ctx.mappings())); } catch {} }
	function loadMappings(): void { try { const raw=localStorage.getItem(LOCAL_KEY); if(!raw) return; const arr=JSON.parse(raw); ctx.setMappings(arr); if(ctx.pdfDoc()) ctx.runtime.renderPageFromDoc?.(ctx.pdfDoc(), ctx.pageIndex(), ctx.scale()); } catch {} }
	return { exportJson, importJson, saveMappings, loadMappings };
}
