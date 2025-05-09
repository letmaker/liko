import { Sound } from '../sound/sound';
import type { ILoader } from './loader-manager';

/**
 * 音频加载器，用于加载和解码音频文件
 * @implements {ILoader}
 */
export class SoundLoader implements ILoader {
  /** 支持的文件类型映射 */
  map: Record<string, boolean> = { mp3: true, sound: true };

  /**
   * 测试是否支持指定的文件类型
   * @param type - 文件类型
   * @returns 是否支持该类型
   */
  test(type: string): boolean {
    return !!this.map[type];
  }

  /**
   * 加载并解码音频文件
   * @param url - 音频文件的URL
   * @returns 解码后的音频缓冲区，加载失败时返回undefined
   */
  async load(url: string) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await Sound.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (e) {
      console.error(`Error loading sound from ${url}`, e);
      return undefined;
    }
  }
}
