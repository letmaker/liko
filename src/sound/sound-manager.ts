import { Sound } from './sound';

/**
 * 音效管理器类，使用对象池管理音效资源
 * 主要用于短暂的游戏音效，避免重复创建实例，提高性能
 */
export class SoundManager {
  private _sounds: Sound[] = [];

  /**
   * 播放指定URL的音效
   * 如果存在相同URL且未在播放的音效实例，将复用该实例；否则创建新实例
   * @param url - 音效资源的URL路径
   * @param volume - 音效音量，范围0-1，默认为1
   * @param autoDestroy - 是否在播放结束后自动销毁，默认为false（回收到对象池）
   */
  play(url: string, volume = 1, autoDestroy = false) {
    let sound = this._sounds.find((sound) => sound.url === url && !sound.isPlaying);
    if (!sound) {
      sound = new Sound(url, false, volume);
      this._sounds.push(sound);
    } else {
      sound.setVolume(volume);
    }
    sound.onEnd = autoDestroy ? (url) => this.destroy(url) : undefined;
    sound.play();
  }

  /**
   * 停止播放指定URL的所有音效实例
   * 不会销毁音效实例，停止后的实例会回到对象池中等待复用
   * @param url - 音效资源的URL路径
   */
  stop(url: string) {
    for (const sound of this._sounds) {
      if (sound.url === url) {
        sound.stop();
      }
    }
  }

  /**
   * 停止播放所有正在播放的音效
   * 所有音效实例都会回到对象池中等待复用
   */
  stopAll() {
    for (const sound of this._sounds) {
      sound.stop();
    }
  }

  /**
   * 销毁指定URL的所有音效实例并从对象池中移除
   * 销毁后无法再复用，下次播放会重新创建实例
   * @param url - 音效资源的URL路径
   */
  destroy(url: string) {
    for (const sound of this._sounds) {
      if (sound.url === url) {
        sound.destroy();
      }
    }
    this._sounds = this._sounds.filter((sound) => !sound.destroyed);
  }

  /**
   * 销毁所有音效实例并清空对象池
   * 建议在场景切换或游戏结束时调用，释放所有音频资源
   */
  destroyAll() {
    for (const sound of this._sounds) {
      sound.destroy();
    }
    this._sounds = [];
  }
}
