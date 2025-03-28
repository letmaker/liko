import { ImageLoader } from "./image-loader";
import { JsonLoader } from "./json-loader";
import { LoaderManager } from "./loader-manager";
import { SheetLoader } from "./sheet-loader";

LoaderManager.regLoader(new ImageLoader());
LoaderManager.regLoader(new JsonLoader());
LoaderManager.regLoader(new SheetLoader());

export const loader = new LoaderManager();
