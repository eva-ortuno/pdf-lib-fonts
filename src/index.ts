import {createMultilingualPDF} from "./create-multilingual-one-font";
import {createMultilingualPDF_severalFonts} from "./create-multilingual-several-fonts";

createMultilingualPDF().catch(console.error);
createMultilingualPDF_severalFonts().catch(console.error);