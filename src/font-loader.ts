import fs from 'fs';
import path from 'path';
import { PDFDocument, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

type FontEntry = {
    name: string;
    font: PDFFont;
    supports: (char: string) => boolean;
};

async function loadFonts(pdfDoc: PDFDocument, fontsDir: string): Promise<FontEntry[]> {
    const fontFiles = fs.readdirSync(fontsDir).filter(f => f.endsWith('.otf') || f.endsWith('.ttf'));
    const entries: FontEntry[] = [];

    for (const file of fontFiles) {
        const fullPath = path.join(fontsDir, file);
        const bytes = fs.readFileSync(fullPath);
        const parsed = fontkit.create(bytes);
        const font = await pdfDoc.embedFont(bytes, { subset: false }); // keep full character set

        entries.push({
            name: file,
            font,
            supports: (char: string) => parsed.hasGlyphForCodePoint(char.codePointAt(0)!),
        });
    }

    return entries;
}

function drawTextWithFallback(
    page: any,
    text: string,
    fonts: FontEntry[],
    xStart: number,
    y: number,
    size: number
) {
    let x = xStart;
    let buffer = '';
    let currentFont: FontEntry | null = null;

    for (const char of text) {
        const font = fonts.find(f => f.supports(char));
        if (!font) {
            console.warn(`⚠️ No font for: ${char}`);
            continue;
        }

        if (font !== currentFont) {
            // flush old buffer
            if (buffer && currentFont) {
                page.drawText(buffer, {
                    x,
                    y,
                    size,
                    font: currentFont.font,
                });
                x += currentFont.font.widthOfTextAtSize(buffer, size);
            }
            // switch font
            currentFont = font;
            buffer = char;
        } else {
            buffer += char;
        }
    }

    // flush remaining
    if (buffer && currentFont) {
        page.drawText(buffer, {
            x,
            y,
            size,
            font: currentFont.font,
        });
    }
}

export async function create_withFontLoader() {
    const inputPath = path.resolve(__dirname, '../pdf/input.pdf');
    const hasExistingPdf = fs.existsSync(inputPath);

    const pdfDoc = hasExistingPdf
        ? await PDFDocument.load(fs.readFileSync(inputPath))
        : await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fonts = await loadFonts(pdfDoc, path.resolve(__dirname, '../fonts'));

    const page = hasExistingPdf ? pdfDoc.getPages()[0] : pdfDoc.addPage([595, 842]);

    const text = 'Hello, world! (Latin) \n Γειά σου Κόσμε (Greek) \n 你好世界 (Chinese) \n こんにちは世界 (Japanese) \n 한국 사람 (Korean) \n مرحبا بالعالم (Arabic)';

    drawTextWithFallback(
        page,
        text,
        fonts,
        50,
        650,
        8
    );

    const output = await pdfDoc.save();
    fs.writeFileSync('./pdf/output-loader.pdf', output);
}