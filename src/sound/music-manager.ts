import { Sound } from './sound';

/**
 * 音乐管理器类，用于管理背景音乐或需要精确控制的长音频
 * 每个URL对应一个唯一的音乐实例，支持暂停、恢复、淡入淡出等精细控制
 */
export class MusicManager {
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
