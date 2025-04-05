import { Sound } from "./sound";

/**
 * 音效管理器类，使用对象池管理音效资源
 * 主要用于短暂的游戏音效，避免重复创建实例
 */
class SoundManager {
  private _sounds: Sound[] = [];

  /**
   * 播放指定URL的音效
   * @param url - 音效资源的URL
   * @param volume - 音效音量，范围0-1
   * @param autoDestroy - 是否在播放结束后自动销毁，默认为false，会被回收到对象池
   */
  play(url: string, volume: number, autoDestroy = false) {
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
   * 停止播放指定URL的所有音效
   * @param url - 音效资源的URL
   */
  stop(url: string) {
    for (const sound of this._sounds) {
      if (sound.url === url) {
        sound.stop();
      }
    }
  }

  /**
   * 停止播放所有音效
   */
  stopAll() {
    for (const sound of this._sounds) {
      sound.stop();
    }
  }

  /**
   * 销毁指定URL的所有音效实例
   * @param url - 音效资源的URL
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
   * 销毁所有音效实例
   */
  destroyAll() {
    for (const sound of this._sounds) {
      sound.destroy();
    }
    this._sounds = [];
  }
}

/**
 * 音乐管理器类，用于管理背景音乐或需要精确控制的长音频
 */
class MusicManager {
  private _music: Record<string, Sound> = {};

  /**
   * 播放指定URL的音乐
   * @param url - 音乐资源的URL
   * @param loop - 是否循环播放
   * @param volume - 音乐音量，范围0-1
   * @param autoDestroy - 是否在播放结束后自动销毁，默认为false
   * @returns 返回创建或复用的Sound实例
   */
  play(url: string, loop = true, volume = 1, autoDestroy = false): Sound {
    let music = this._music[url];
    if (music && !music.destroyed) {
      music.setLoop(loop);
      music.setVolume(volume);
    } else {
      music = new Sound(url, loop, volume);
      this._music[url] = music;
    }

    music.onEnd = autoDestroy ? (url) => this.destroy(url) : undefined;
    music.play();

    return music;
  }

  /**
   * 暂停指定URL的音乐
   * @param url - 音乐资源的URL
   */
  pause(url: string) {
    this._music[url]?.pause();
  }

  /**
   * 暂停所有音乐
   */
  pauseAll() {
    for (const music of Object.values(this._music)) {
      music.pause();
    }
  }

  /**
   * 恢复播放指定URL的音乐
   * @param url - 音乐资源的URL
   */
  resume(url: string) {
    this._music[url]?.resume();
  }

  /**
   * 恢复播放所有音乐
   */
  resumeAll() {
    for (const music of Object.values(this._music)) {
      music.resume();
    }
  }

  /**
   * 停止播放指定URL的音乐
   * @param url - 音乐资源的URL
   */
  stop(url: string) {
    this._music[url]?.stop();
  }

  /**
   * 停止播放所有音乐
   */
  stopAll() {
    for (const music of Object.values(this._music)) {
      music.stop();
    }
  }

  /**
   * 设置指定URL音乐的音量
   * @param url - 音乐资源的URL
   * @param volume - 音量值，范围0-1
   * @param fadeTime - 淡入淡出时间(秒)，0表示立即生效
   */
  setVolume(url: string, volume: number, fadeTime = 0) {
    this._music[url]?.setVolume(volume, fadeTime);
  }

  /**
   * 设置所有音乐的音量
   * @param volume 音量值，范围0-1
   * @param fadeTime 淡入淡出时间(秒)，0表示立即生效，默认为0
   */
  setVolumeAll(volume: number, fadeTime = 0) {
    for (const music of Object.values(this._music)) {
      music.setVolume(volume, fadeTime);
    }
  }

  /**
   * 设置指定URL音乐的循环状态
   * @param loop - 是否循环播放
   * @param url - 音乐资源的URL
   */
  setLoop(url: string, loop: boolean) {
    this._music[url]?.setLoop(loop);
  }

  /**
   * 设置所有音乐的循环状态
   * @param loop 是否循环播放
   */
  setLoopAll(loop: boolean) {
    for (const music of Object.values(this._music)) {
      music.setLoop(loop);
    }
  }

  /**
   * 设置指定URL音乐的播放速率
   * @param playbackRate - 播放速率，范围0.1-10
   * @param url - 音乐资源的URL
   */
  setPlaybackRate(url: string, playbackRate: number) {
    this._music[url]?.setPlaybackRate(playbackRate);
  }

  /**
   * 设置所有音乐的播放速率
   * @param playbackRate 播放速率，范围0.1-10
   */
  setPlaybackRateAll(playbackRate: number) {
    for (const music of Object.values(this._music)) {
      music.setPlaybackRate(playbackRate);
    }
  }

  /**
   * 销毁指定URL的音乐实例
   * @param url 音乐资源的URL
   */
  destroy(url: string) {
    this._music[url]?.destroy();
    delete this._music[url];
  }

  /**
   * 销毁所有音乐实例
   */
  destroyAll() {
    for (const music of Object.values(this._music)) {
      music.destroy();
    }
    this._music = {};
  }
}

/**
 * 音效管理器实例，用于管理短暂的游戏音效，使用对象池管理
 * 推荐使用 sound.play(url, volume) 方法播放游戏音效
 */
export const sound = new SoundManager();

/**
 * 音乐管理器实例，用于管理背景音乐或需要精确控制的长音频
 * 推荐使用 music.play(url, volume, loop) 方法播放背景音乐
 */
export const music = new MusicManager();
