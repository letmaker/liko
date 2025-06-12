import { Sound } from './sound';

/**
 * 音效管理器类，使用对象池管理音效资源
 * 主要用于短暂的游戏音效，避免重复创建实例，提高性能
 */
class SoundManager {
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

/**
 * 音乐管理器类，用于管理背景音乐或需要精确控制的长音频
 * 每个URL对应一个唯一的音乐实例，支持暂停、恢复、淡入淡出等精细控制
 */
class MusicManager {
  private _music: Record<string, Sound> = {};

  /**
   * 播放指定URL的音乐
   * 如果音乐实例已存在且未被销毁，将复用该实例；否则创建新实例
   * @param url - 音乐资源的URL路径
   * @param loop - 是否循环播放，默认为true
   * @param volume - 音乐音量，范围0-1，默认为1
   * @param autoDestroy - 是否在播放结束后自动销毁，默认为false
   * @returns 返回创建或复用的Sound实例，可用于更精细的控制
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
   * 暂停指定URL的音乐播放
   * 暂停后可使用resume方法恢复播放
   * @param url - 音乐资源的URL路径
   */
  pause(url: string) {
    this._music[url]?.pause();
  }

  /**
   * 暂停所有正在播放的音乐
   * 所有暂停的音乐都可以通过resumeAll或单独resume恢复播放
   */
  pauseAll() {
    for (const music of Object.values(this._music)) {
      music.pause();
    }
  }

  /**
   * 恢复播放指定URL的音乐
   * 只对之前暂停的音乐有效
   * @param url - 音乐资源的URL路径
   */
  resume(url: string) {
    this._music[url]?.resume();
  }

  /**
   * 恢复播放所有暂停的音乐
   * 只对之前暂停的音乐有效
   */
  resumeAll() {
    for (const music of Object.values(this._music)) {
      music.resume();
    }
  }

  /**
   * 停止播放指定URL的音乐
   * 停止后音乐会重新回到开始位置，下次播放会从头开始
   * @param url - 音乐资源的URL路径
   */
  stop(url: string) {
    this._music[url]?.stop();
  }

  /**
   * 停止播放所有音乐
   * 所有音乐都会重新回到开始位置
   */
  stopAll() {
    for (const music of Object.values(this._music)) {
      music.stop();
    }
  }

  /**
   * 设置指定URL音乐的音量
   * 音量变化会立即生效
   * @param url - 音乐资源的URL路径
   * @param volume - 音量值，范围0-1，0为静音，1为最大音量
   */
  setVolume(url: string, volume: number) {
    this._music[url]?.setVolume(volume);
  }

  /**
   * 设置所有音乐的音量
   * 适用于全局音乐音量控制
   * @param volume - 音量值，范围0-1，0为静音，1为最大音量
   */
  setVolumeAll(volume: number) {
    for (const music of Object.values(this._music)) {
      music.setVolume(volume);
    }
  }

  /**
   * 淡入指定URL的音乐
   * 音乐音量会从0逐渐增加到当前设置的音量值
   * @param url - 音乐资源的URL路径
   * @param fadeTime - 淡入时间，单位秒，默认为1秒
   */
  fadeIn(url: string, fadeTime = 1) {
    this._music[url]?.fadeIn(fadeTime);
  }

  /**
   * 淡入所有音乐
   * 所有音乐的音量都会从0逐渐增加到各自设置的音量值
   * @param fadeTime - 淡入时间，单位秒，默认为1秒
   */
  fadeInAll(fadeTime = 1) {
    for (const music of Object.values(this._music)) {
      music.fadeIn(fadeTime);
    }
  }

  /**
   * 淡出指定URL的音乐
   * 音乐音量会从当前值逐渐减少到0
   * @param url - 音乐资源的URL路径
   * @param fadeTime - 淡出时间，单位秒，默认为1秒
   */
  fadeOut(url: string, fadeTime = 1) {
    this._music[url]?.fadeOut(fadeTime);
  }

  /**
   * 淡出所有音乐
   * 所有音乐的音量都会从当前值逐渐减少到0
   * @param fadeTime - 淡出时间，单位秒，默认为1秒
   */
  fadeOutAll(fadeTime = 1) {
    for (const music of Object.values(this._music)) {
      music.fadeOut(fadeTime);
    }
  }

  /**
   * 设置指定URL音乐的循环状态
   * 可以在播放过程中动态修改循环设置
   * @param url - 音乐资源的URL路径
   * @param loop - 是否循环播放，true为循环，false为播放一次后停止
   */
  setLoop(url: string, loop: boolean) {
    this._music[url]?.setLoop(loop);
  }

  /**
   * 设置所有音乐的循环状态
   * 适用于全局循环设置的控制
   * @param loop - 是否循环播放，true为循环，false为播放一次后停止
   */
  setLoopAll(loop: boolean) {
    for (const music of Object.values(this._music)) {
      music.setLoop(loop);
    }
  }

  /**
   * 设置指定URL音乐的播放速率
   * 影响音乐的播放速度和音调，可用于特殊音效或时间控制
   * @param url - 音乐资源的URL路径
   * @param playbackRate - 播放速率，范围0.1-10，1为正常速度，小于1为减速，大于1为加速
   */
  setPlaybackRate(url: string, playbackRate: number) {
    this._music[url]?.setPlaybackRate(playbackRate);
  }

  /**
   * 设置所有音乐的播放速率
   * 适用于全局播放速度的控制，如游戏加速/减速效果
   * @param playbackRate - 播放速率，范围0.1-10，1为正常速度，小于1为减速，大于1为加速
   */
  setPlaybackRateAll(playbackRate: number) {
    for (const music of Object.values(this._music)) {
      music.setPlaybackRate(playbackRate);
    }
  }

  /**
   * 销毁指定URL的音乐实例并从管理器中移除
   * 销毁后该音乐的所有状态都会丢失，下次播放会重新创建
   * @param url - 音乐资源的URL路径
   */
  destroy(url: string) {
    this._music[url]?.destroy();
    delete this._music[url];
  }

  /**
   * 销毁所有音乐实例并清空管理器
   * 建议在场景切换或游戏结束时调用，释放所有音乐资源
   */
  destroyAll() {
    for (const music of Object.values(this._music)) {
      music.destroy();
    }
    this._music = {};
  }
}

/**
 * 音效管理器实例，用于管理短暂的游戏音效，使用对象池管理资源
 * 推荐用于：点击音效、爆炸音效、收集音效等短暂且频繁播放的音效
 *
 * 特点：
 * - 自动复用相同URL的音效实例，提高性能
 * - 不支持暂停恢复，适合一次性播放的短音效
 * - 使用对象池管理，减少垃圾回收压力
 * - 建议为游戏中的点击、爆炸、收集等短音效使用此管理器
 *
 * 使用示例：
 * ```typescript
 * // 播放音效
 * sound.play('sounds/click.mp3', 0.8);
 *
 * // 停止特定音效
 * sound.stop('sounds/click.mp3');
 *
 * // 停止所有音效
 * sound.stopAll();
 *
 * // 销毁音效资源
 * sound.destroy('sounds/click.mp3');
 * ```
 */
export const sound = new SoundManager();

/**
 * 音乐管理器实例，用于管理背景音乐或需要精确控制的长音频
 * 推荐用于：背景音乐、环境音效、语音播放等需要精细控制的音频
 *
 * 特点：
 * - 支持暂停恢复功能，适合长时间播放的音频
 * - 提供丰富的音频控制方法（淡入淡出、播放速率等）
 * - 每个URL维护唯一实例，便于状态管理
 * - 返回Sound实例，支持更精细的控制操作
 * - 建议为游戏中的背景音乐、环境音效、语音播放等长音频使用此管理器
 *
 * * 使用示例：
 * ```typescript
 * // 播放背景音乐（循环）
 * music.play('music/background.mp3', true, 0.6);
 *
 * // 暂停和恢复音乐
 * music.pause('music/background.mp3');
 * music.resume('music/background.mp3');
 *
 * // 音量淡入淡出
 * music.fadeIn('music/background.mp3', 2);
 * music.fadeOut('music/background.mp3', 3);
 *
 * // 设置播放速率
 * music.setPlaybackRate('music/background.mp3', 1.2);
 *
 * // 获取音乐实例进行更多控制
 * const bgMusic = music.play('music/background.mp3');
 * ```
 */
export const music = new MusicManager();
