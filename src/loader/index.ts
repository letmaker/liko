import { ImageLoader } from './image-loader';
import { JsonLoader } from './json-loader';
import { LoaderManager } from './loader-manager';
import { SheetLoader } from './sheet-loader';
import { SoundLoader } from './sound-loader';
import { TextLoader } from './text-loader';

LoaderManager.regLoader(new ImageLoader());
LoaderManager.regLoader(new JsonLoader());
LoaderManager.regLoader(new SheetLoader());
LoaderManager.regLoader(new SoundLoader());
LoaderManager.regLoader(new TextLoader());

/**
 * 资源加载管理器，负责资源的加载、缓存和事件分发
 *
 * @see {@link LoaderManager}
 *
 * 该类提供统一的资源加载接口，支持多种资源类型的加载器注册，
 * 内置资源缓存机制和加载进度追踪，通过事件系统通知加载状态变化。
 *
 * 支持的事件类型：
 * - EventType.progress: 加载进度更新 (参数: progress: number)
 * - EventType.loaded: 单个资源加载完成 (参数: url: string, resource: any)
 * - EventType.error: 资源加载失败 (参数: url: string, error: string)
 * - EventType.complete: 所有资源加载完成
 *
 * @example
 * ```typescript
 * // 加载图片资源
 * const texture = await loader.load<Texture>('/assets/sprite.png');
 * // 加载图集资源，返回一个纹理数组
 * const textures = await loader.load<Texture[]>('/data/player.atlas');
 * // 加载 JSON 资源
 * const data = await loader.load<any>('/data/config.json');
 *
 * // 批量加载
 * const promises = [
 *   loader.load('/assets/bg.jpg'),
 *   loader.load('/sounds/music.mp3'),
 *   loader.load('/data/levels.json')
 * ];
 * await Promise.all(promises);
 *
 * // 监听加载事件
 * loader.on(EventType.progress, (progress) => {
 *   console.log(`加载进度: ${Math.round(progress * 100)}%`);
 * });
 *
 * loader.on(EventType.complete, () => {
 *   console.log('所有资源加载完成');
 * });
 *
 * // 注册自定义加载器
 * LoaderManager.regLoader({
 *   test: (type) => type === 'json',
 *   load: async (url) => {
 *     const response = await fetch(url);
 *     return response.json();
 *   }
 * });
 * ```
 */
export const loader = new LoaderManager();

/**
 * 资源加载管理器，负责资源的加载、缓存和事件分发
 * 请直接使用 loader 实例，不要直接使用 LoaderManager 类
 */
export { LoaderManager } from './loader-manager';
