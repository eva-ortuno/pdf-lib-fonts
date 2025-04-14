import path from "path";
import fs from "fs";
import {PDFDocument} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export async function createMultilingualPDF_severalFonts() {
    const fontsDir = path.resolve(__dirname, '../fonts');
    const fontFiles = fs.readdirSync(fontsDir).filter(file => file.endsWith('.otf') || file.endsWith('.ttf'));

    const inputPath = path.resolve(__dirname, '../pdf/input.pdf');
    const hasExistingPdf = fs.existsSync(inputPath);

    const pdfDoc = hasExistingPdf
        ? await PDFDocument.load(fs.readFileSync(inputPath))
        : await PDFDocument.create();

    pdfDoc.registerFontkit(fontkit)

    const fontMap: Record<string, any> = {};

    // Load & embed all fonts
    for (const fontFile of fontFiles) {
        const fontPath = path.join(fontsDir, fontFile);
        const fontBytes = fs.readFileSync(fontPath);
        fontMap[fontFile] = await pdfDoc.embedFont(fontBytes, {subset: false});
        console.log(`✅ Loaded: ${fontFile}`);
    }

    const page = hasExistingPdf ? pdfDoc.getPages()[0] : pdfDoc.addPage([595, 842]);

    const text = 'Hello, world! (Latin) \n Γειά σου Κόσμε (Greek) \n 你好世界 (Chinese) \n こんにちは世界 (Japanese) \n 한국 사람 (Korean) \n مرحبا بالعالم (Arabic)';

    const fontNames = Object.keys(fontMap);
    let y = 650;

    for (const font of fontNames) {
        const selectedFont = fontMap[font];

        page.drawText(`${font} : ${text}`, {
            x: 50,
            y,
            size: 8,
            font: selectedFont,
        });

        y -= 150;
    }

    const pdfBytes = await pdfDoc.save();
    const outputPath = path.resolve(__dirname, '../pdf/output-several.pdf');
    fs.writeFileSync(outputPath, pdfBytes);

    console.log('📄 PDF written to:', outputPath);
}