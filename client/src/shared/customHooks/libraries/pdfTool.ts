import { PDFDocument, PDFField, StandardFonts, PDFFont, rgb } from "pdf-lib";

export async function GetPDFTool(pdfData: Uint8Array): Promise<PDFTool> {
    const document = await PDFDocument.load(pdfData);
    // Keep a pristine clone so we can reset edits later
    const cleanDoc = await PDFDocument.load(pdfData);
    return new PDFTool(document, cleanDoc);
}

export interface PDFFieldMap {
    llc: { x: number; y: number };
    urc: { x: number; y: number };
    value: string;
    page?: number; // 0-based page index (default 0 if omitted)
    format?: PDFStyleOptions; // Optional per-field style overrides
}

/**
 * Style options controlling form field text appearance.
 * - fontSize: native field sizing (safe)
 * - fontName: Standard font face (embedded once & cached)
 * - customFontBytes: Raw font data (embedded once & cached using a hash key)
 * If both fontName and customFontBytes provided, customFontBytes wins.
 */
export interface PDFStyleOptions {
    fontSize?: number;
    fontName?: (typeof StandardFonts)[keyof typeof StandardFonts];
    customFontBytes?: Uint8Array; // Per-field or default custom font
    fontColor?: { r: number; g: number; b: number }; // 0-1 range; applied via overlay draw
}

class PDFTool {
    public document: PDFDocument;
    private cleanDocument: PDFDocument | null = null;
    private fieldNames: string[] = [];
    private fields: PDFFieldMap[] = [];
    private currentFont: PDFFont | null = null; // Legacy active font (still used by styleTextFields)
    private defaultStyle: PDFStyleOptions | null = null;
    private fontCache: Map<string, PDFFont> = new Map();

    constructor(document: PDFDocument, cleanDocument: PDFDocument) {
        this.document = document;
        this.cleanDocument = cleanDocument;
    }

    /**
     * Embed and set a standard font (e.g. 'Helvetica', 'TimesRoman', etc.) to use when updating appearances.
     */
    public async useStandardFont(fontName: (typeof StandardFonts)[keyof typeof StandardFonts]) {
        this.currentFont = await this.document.embedFont(fontName);
    }

    /**
     * Embed a custom font from raw bytes and set as active font.
     */
    public async useCustomFont(fontBytes: Uint8Array) {
        this.currentFont = await this.document.embedFont(fontBytes);
    }

    /**
     * Apply style settings to specified text fields. Currently supports font size (native) and font face via updateAppearances.
     * NOTE: Changing text color for form fields requires a custom appearance provider with pdf-lib; not implemented here for safety.
     */
    public styleTextFields(opts: { fieldNames?: string[]; fontSize?: number }) {
        const { fieldNames, fontSize } = opts;
        const targets = fieldNames ?? this.getFieldNames();
        const form = this.getForm();
        targets.forEach(name => {
            let field: any;
            try { field = form.getTextField(name); } catch { return; }
            if (!field) return;
            if (fontSize && typeof field.setFontSize === 'function') field.setFontSize(fontSize);
            if (this.currentFont && typeof field.updateAppearances === 'function') {
                try { field.updateAppearances(this.currentFont); } catch { /* ignore */ }
            }
        });
    }

    /**
     * Set a default style applied to every field unless overridden by a field's own format.
     */
    public setDefaultStyle(style: PDFStyleOptions) {
        this.defaultStyle = style;
    }

    /**
     * Returns the effective style for a given field (merge of default + per-field override).
     */
    private getEffectiveStyle(fieldMap: PDFFieldMap): PDFStyleOptions | null {
        if (!this.defaultStyle && !fieldMap.format) return fieldMap.format ?? null;
        return { ...(this.defaultStyle || {}), ...(fieldMap.format || {}) };
    }

    /**
     * Resolve (embed/cache) a font for a given style. Preference order:
     * 1. customFontBytes (hashed key)
     * 2. fontName standard
     * 3. existing currentFont
     */
    private async resolveFont(style?: PDFStyleOptions): Promise<PDFFont | null> {
        if (!style) return this.currentFont;
        if (style.customFontBytes) {
            const key = `custom:${this.hashBytes(style.customFontBytes)}`;
            if (this.fontCache.has(key)) return this.fontCache.get(key)!;
            const font = await this.document.embedFont(style.customFontBytes);
            this.fontCache.set(key, font);
            return font;
        }
        if (style.fontName) {
            const key = `std:${style.fontName}`;
            if (this.fontCache.has(key)) return this.fontCache.get(key)!;
            const font = await this.document.embedFont(style.fontName);
            this.fontCache.set(key, font);
            return font;
        }
        return this.currentFont;
    }

    /** Simple hash for Uint8Array (djb2). */
    private hashBytes(bytes: Uint8Array): string {
        let hash = 5381;
        for (let i = 0; i < bytes.length; i++) hash = ((hash << 5) + hash) ^ bytes[i];
        return (hash >>> 0).toString(16);
    }

    /** Apply style (fontSize + font face) to a text field. */
    private applyStyleToField(field: any, style: PDFStyleOptions | null, font: PDFFont | null) {
        if (!style) return;
        if (style.fontSize && typeof field.setFontSize === 'function') {
            try { field.setFontSize(style.fontSize); } catch { /* ignore */ }
        }
        if (font && typeof field.updateAppearances === 'function') {
            try { field.updateAppearances(font); } catch { /* ignore */ }
        }
    }

    public getPages() {
        return this.document.getPages();
    }

    public getForm() {
        return this.document.getForm();
    }

    public getFormFields() {
        const form = this.getForm();
        const fields = form.getFields();
        this.fieldNames = fields.map((field) => field.getName());
        return fields;
    }

    public getFieldNames(): string[] {
        if (this.fieldNames.length === 0) {
            this.getFormFields();
        }
        return this.fieldNames;
    }

    public setFieldMaps(fieldValues: PDFFieldMap[]) {
        this.fields = fieldValues;
    }

    public getFieldMaps() {
        return this.fields;
    }

    private findField(name: string): PDFField | undefined {
        const form = this.getForm();
        return form.getFields().find(f => f.getName() === name);
    }

    public async resetToClean(): Promise<void> {
        if (!this.cleanDocument) return;
        const cleanBytes = await this.cleanDocument.save();
        this.document = await PDFDocument.load(cleanBytes);
        this.fieldNames = [];
    }

    public async RenderPDF(): Promise<Uint8Array> {
        if (!this.fields || this.fields.length === 0) return await this.document.save();

        const pages = this.getPages();
        if (!pages.length) return await this.document.save();

        for (const map of this.fields) {
            const { value, llc, urc } = map;
            const pageIndex = map.page ?? 0;
            const targetPage = pages[pageIndex] ?? pages[0];
            // Calculate bounding box width / height from lower-left corner (llc) and upper-right corner (urc)
            const width = Math.max(0, urc.x - llc.x);
            const height = Math.max(0, urc.y - llc.y);

            const style = this.getEffectiveStyle(map);
            const font = await this.resolveFont(style || undefined) || this.currentFont || await this.document.embedFont(StandardFonts.Helvetica);
            const size = style?.fontSize || 12;

            // Simple text wrapping inside the bounding box (single line fallback)
            const lines = this.wrapText(value, font, size, width);
            const lineHeight = size * 1.15;
            let cursorY = llc.y + height - lineHeight; // start near top within box

            for (const line of lines) {
                if (cursorY < llc.y) break; // overflow
                targetPage.drawText(line, {
                    x: llc.x + 2,
                    y: cursorY,
                    size,
                    font,
                    color: style?.fontColor ? rgb(style.fontColor.r, style.fontColor.g, style.fontColor.b) : undefined,
                });
                cursorY -= lineHeight;
            }
        }
        return await this.document.save();
    }

    /** Very small word-wrap helper (does not hyphenate). */
    private wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
        if (maxWidth <= 0) return [text];
        const words = text.split(/\s+/g);
        const lines: string[] = [];
        let current = '';
        for (const w of words) {
            const test = current ? current + ' ' + w : w;
            const width = font.widthOfTextAtSize(test, size);
            if (width > maxWidth && current) {
                lines.push(current);
                current = w;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        return lines;
    }
}

export { PDFTool };