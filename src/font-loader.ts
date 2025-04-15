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
    const char = text[0]

    const font = fonts.find(f => f.supports(char)) || fonts.find(f => f.name === "NotoSans-Regular.ttf");
    if (!font) {
        console.warn(`⚠️ No font for: ${char}`);
        return;
    }

    page.drawText(text, { x, y, size, font: font.font });

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

    const text = ['Hello, world!', 'Γειά σου Κόσμε', '你好世界', 'こんにちは世界', '한국 사람', 'Зарегистр' ,'وب وغيرها. مثال', 'дe oпште дост', 'učestvuje u kulturnom životu zajednice, da uživ'];

    let y = 650
    for (const sub of text) {
        console.time()
        drawTextWithFallback(page,sub,fonts,50,y,8);
        console.timeEnd();
        y -= 30
    }


    const output = await pdfDoc.save();
    fs.writeFileSync('./pdf/output-loader.pdf', output);
}