import {createMultilingualPDF} from "./create-multilingual-one-font";
import {createMultilingualPDF_severalFonts} from "./create-multilingual-several-fonts";
import {create_withFontLoader} from "./font-loader";

createMultilingualPDF().catch(console.error);
createMultilingualPDF_severalFonts().catch(console.error);
create_withFontLoader().catch(console.error);