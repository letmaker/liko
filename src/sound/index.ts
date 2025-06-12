import { MusicManager } from './music-manager';
import { SoundManager } from './sound-manager';

/**
 * 音效管理器实例，用于管理短暂的游戏音效，使用对象池管理资源
 * 推荐用于：点击音效、爆炸音效、收集音效等短暂且频繁播放的音效
 *
 * @see {@link SoundManager}
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
 * @see {@link MusicManager}
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
