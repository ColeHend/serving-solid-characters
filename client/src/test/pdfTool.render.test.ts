import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { GetPDFTool, PDFFieldMap } from '../shared/customHooks/libraries/pdfTool';

async function makeBlankPdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i=0;i<pages;i++) {
    const page = doc.addPage([400, 400]);
    page.drawText(`Page ${i+1}`, { x: 10, y: 380, size: 12, font });
  }
  return await doc.save();
}

function getSize(bytes: Uint8Array) { return bytes.length; }

describe('PDFTool RenderPDF', () => {
  it('renders single field increases PDF size', async () => {
    const pdfBytes = await makeBlankPdf(1);
    const baseSize = getSize(pdfBytes);
    const tool = await GetPDFTool(pdfBytes);
    const maps: PDFFieldMap[] = [{ llc:{x:50,y:50}, urc:{x:150,y:80}, value:'Hello World', page:0, format:{ fontSize: 14 } }];
    tool.setFieldMaps(maps);
    const out = await tool.RenderPDF();
    expect(getSize(out)).toBeGreaterThan(baseSize);
  });

  it('renders fields on multiple pages increases size more', async () => {
    const pdfBytes = await makeBlankPdf(2);
    const baseSize = getSize(pdfBytes);
    const tool = await GetPDFTool(pdfBytes);
    const maps: PDFFieldMap[] = [
      { llc:{x:40,y:40}, urc:{x:140,y:70}, value:'First Page Value', page:0 },
      { llc:{x:60,y:60}, urc:{x:200,y:100}, value:'Second Page Field', page:1 }
    ];
    tool.setFieldMaps(maps);
    const out = await tool.RenderPDF();
    expect(getSize(out)).toBeGreaterThan(baseSize + 50); // heuristic growth
  });

  it('wrapping larger text increases size further', async () => {
    const pdfBytes = await makeBlankPdf(1);
    const baseSize = getSize(pdfBytes);
    const tool = await GetPDFTool(pdfBytes);
    const long = 'This is a long sequence of words that should wrap across multiple lines within the bounding box area to validate wrapping logic.';
    tool.setFieldMaps([{ llc:{x:20,y:40}, urc:{x:120,y:120}, value: long, page:0, format:{ fontSize: 10 } }]);
    const out = await tool.RenderPDF();
    expect(getSize(out)).toBeGreaterThan(baseSize + 50);
  });
});
