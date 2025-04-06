import { loader } from "../loader";
import { getUniqueID } from "../utils/utils";

/**
 * 音频处理类，基于Web Audio API
 * 提供音频加载、播放、暂停、恢复等基本功能
 */
export class Sound {
  /** 全局共享的音频上下文 */
  static audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  /**
   * 确保音频上下文处于活动状态
   * @returns 音频上下文是否成功激活
   */
  static async ensureAudioContext() {
    if (Sound.audioContext.state === "suspended") {
      try {
        await Sound.audioContext.resume();
        return true;
      } catch (error) {
        console.error("Failed to resume audio context:", error);
        return false;
      }
    }
    return true;
  }

  /** 音频资源URL */
  url: string;
  /** 音量大小 (0.0-1.0) */
  volume: number;
  /** 是否循环播放 */
  loop: boolean;
  /** 播放速率倍数 */
  playbackRate = 1.0;
  /** 当前是否正在播放 */
  isPlaying = false;
  /** 是否已销毁 */
  destroyed = false;

  /** 音频播放结束回调函数 */
  onEnd?: (url: string) => void;

  private _gainNode = Sound.audioContext.createGain();
  private _source?: AudioBufferSourceNode;
  private _startTime = 0;
  private _offset = 0;
  private _audioPlaying = false;
  private _playID = 0;

  /**
   * 获取当前播放时间
   * @returns 当前播放时间(秒)
   */
  currentTime(): number {
    if (!this.isPlaying || this.destroyed) return this._offset;
    return this._offset + (Sound.audioContext.currentTime - this._startTime);
  }

  /**
   * 获取音频总时长
   * @returns 音频总时长(秒)
   */
  duration(): number {
    const buffer = loader.get(this.url) as AudioBuffer;
    return buffer ? buffer.duration : 0;
  }

  /**
   * 创建音频实例
   * @param url - 音频资源URL
   * @param volume - 音量大小(0.0-1.0)
   * @param loop - 是否循环播放
   */
  constructor(url: string, loop = false, volume = 1) {
    this.url = url;
    this.loop = loop;
    this.volume = this.setVolume(volume);

    this._gainNode.gain.value = volume;
    this._gainNode.connect(Sound.audioContext.destination);

    console.log("create sound", this.url);
  }

  /**
   * 播放音频
   * @param offset - 开始播放的时间偏移量(秒)
   */
  play(offset = 0) {
    if (this.isPlaying || this.destroyed) return;

    this.isPlaying = true;
    this._playID = getUniqueID();
    this._offset = offset;
    this._load(this._playID).then((source) => {
      if (source) {
        this._source = source;
        console.log("play", this.url, this._offset);
        this._audioPlaying = true;
        this._source.start(0, this._offset);
        this._startTime = Sound.audioContext.currentTime;
      }
    });
  }

  /**
   * 加载音频资源并创建音频源
   */
  private async _load(playID: number) {
    const buffer = await loader.load<AudioBuffer>(this.url);
    if (!buffer || this.destroyed || !this.isPlaying || this._playID !== playID) {
      return undefined;
    }

    const source = Sound.audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = this.playbackRate;
    source.loop = this.loop;
    source.connect(this._gainNode);

    source.onended = () => {
      if (!this.loop) {
        this.stop();
        this.onEnd?.(this.url);
      }
    };

    return source;
  }

  /**
   * 暂停播放
   * @returns 暂停时的播放位置(秒)
   */
  pause(): number {
    if (!this.isPlaying || this.destroyed) return this._offset;

    this.isPlaying = false;
    this._offset += Sound.audioContext.currentTime - this._startTime;

    if (this._source && this._audioPlaying) {
      this._source.stop();
      this._source = undefined;
      this._audioPlaying = false;
    }

    return this._offset;
  }

  /**
   * 从暂停位置恢复播放
   */
  resume() {
    if (this.isPlaying || this.destroyed) return;

    this.play(this._offset);
  }

  /**
   * 停止播放并重置播放位置
   */
  stop() {
    if (!this.isPlaying || this.destroyed) return;

    this.isPlaying = false;
    this._offset = 0;

    console.log("stop", this.url, this._offset);

    if (this._source && this._audioPlaying) {
      this._source.stop();
      this._source = undefined;
      this._audioPlaying = false;
    }
  }

  /**
   * 设置是否循环播放
   * @param loop - 是否循环播放
   */
  setLoop(loop: boolean) {
    if (this.loop === loop || this.destroyed) return;

    this.loop = loop;
    if (this._source) {
      this._source.loop = loop;
    }
  }

  /**
   * 设置音量
   * @param volume - 音量大小(0.0-1.0)
   */
  setVolume(volume: number) {
    if (this.volume === volume || this.destroyed) return this.volume;

    const newVolume = Math.max(0, Math.min(1, volume));
    this.volume = newVolume;
    this._gainNode.gain.value = newVolume;

    return newVolume;
  }

  /**
   * 淡入音频
   * @param fadeTime - 淡入时间(秒)
   */
  fadeIn(fadeTime = 0) {
    const gain = this._gainNode.gain;
    if (fadeTime > 0) {
      const currentTime = Sound.audioContext.currentTime;
      gain.linearRampToValueAtTime(gain.value, currentTime + fadeTime);
      gain.setValueAtTime(0, currentTime);
    }
  }

  /**
   * 淡出音频
   * @param fadeTime - 淡出时间(秒)
   */
  fadeOut(fadeTime = 0) {
    const gain = this._gainNode.gain;
    if (fadeTime > 0) {
      const currentTime = Sound.audioContext.currentTime;
      gain.linearRampToValueAtTime(0, currentTime + fadeTime);
      gain.setValueAtTime(gain.value, currentTime);
    }
  }

  /**
   * 设置播放速率
   * @param rate - 播放速率倍数 0.1-10
   */
  setPlaybackRate(rate: number) {
    if (this.playbackRate === rate || this.destroyed) return this.playbackRate;

    const newRate = Math.max(0.1, Math.min(10, rate));
    this.playbackRate = newRate;

    if (this._source) {
      this._source.playbackRate.value = newRate;
    }
    return newRate;
  }

  /**
   * 销毁音频实例并释放资源
   * @param unloadSound - 是否卸载音频资源
   */
  destroy(unloadSound = true) {
    if (this.destroyed) return;

    this.destroyed = true;
    this.stop();

    if (this._source) {
      this._source.disconnect();
      this._source.onended = null;
      this._source = undefined;
    }
    this._gainNode.disconnect();

    if (unloadSound) loader.unload(this.url);
  }
}
