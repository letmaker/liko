import { ImageLoader } from './image-loader';
import { JsonLoader } from './json-loader';
import { LoaderManager } from './loader-manager';
import { SheetLoader } from './sheet-loader';
import { SoundLoader } from './sound-loader';

LoaderManager.regLoader(new ImageLoader());
LoaderManager.regLoader(new JsonLoader());
LoaderManager.regLoader(new SheetLoader());
LoaderManager.regLoader(new SoundLoader());

export const loader = new LoaderManager();
