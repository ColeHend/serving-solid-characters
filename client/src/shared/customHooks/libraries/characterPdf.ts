import { PDFDocument, StandardFonts } from "pdf-lib";
import { Character } from "../../../models/character.model";
import { GetPDFTool, PDFFieldMap } from "./pdfTool";

export async function generateCharacterPdf(pdf: Uint8Array, version: "2014" | "2024", character: Character) {
    const pdfDoc = await GetPDFTool(pdf);
    const fields2014: PDFFieldMap[] = get2014Fields(character);
    const fields2024: PDFFieldMap[] = get2024Fields(character);
    if (version === "2014") {
        pdfDoc.setFieldMaps(fields2014);
    } else if (version === "2024") {
        pdfDoc.setFieldMaps(fields2024);
    }
    return await pdfDoc.RenderPDF();
} 

function get2014Fields(character: Character): PDFFieldMap[] {
    return [
        { 
            llc: { x: 50, y: 700 }, 
            urc: { x: 300, y: 720 }, 
            value: character.name,
            format: {
                fontSize: 12,
                fontName: StandardFonts.Courier,
            } 
        },
    ];
}

function get2024Fields(character: Character): PDFFieldMap[] {
    return [
        { 
            llc: { x: 50, y: 700 }, 
            urc: { x: 300, y: 720 }, 
            value: character.name,
            format: {
                fontSize: 12,
                fontName: StandardFonts.Courier,
            } 
        },
    ];
}