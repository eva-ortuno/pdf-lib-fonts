import path from "path";
import fs from "fs";
import {PDFDocument} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export async function createMultilingualPDF() {
    const fontPath = path.resolve(__dirname, '../fonts/NotoSans-Regular.ttf');
    const fontBytes = fs.readFileSync(fontPath);

    const inputPath = path.resolve(__dirname, '../pdf/input.pdf');
    const hasExistingPdf = fs.existsSync(inputPath);

    const pdfDoc = hasExistingPdf
        ? await PDFDocument.load(fs.readFileSync(inputPath))
        : await PDFDocument.create();

    pdfDoc.registerFontkit(fontkit)

    const font = await pdfDoc.embedFont(fontBytes, { subset: true });

    const page = hasExistingPdf ? pdfDoc.getPages()[0] : pdfDoc.addPage([595, 842]);

    const text = 'Hello 世界 Γεια σου Κόσμε';

    page.drawText(text, {
        x: 50,
        y: 650,
        font,
        size: 12,
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(path.resolve(__dirname, '../pdf/output.pdf'), pdfBytes);

    console.log('✅ PDF created: output.pdf');
}