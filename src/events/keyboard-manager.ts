import { EventType } from '../const';
import type { Stage } from '../nodes/stage';

/**
 * 键盘管理器
 */
export class KeyBoardManager {
  private _keydownHandler = this._onKeydown.bind(this);
  private _keyupHandler = this._onKeyup.bind(this);
  private _wheelHandler = this._onWheel.bind(this);
  private _keyMap: Record<string, boolean> = {};

  /** 是否忽略大小写，默认为 true */
  public ignoreCase = true;

  constructor(public stage: Stage) {
    globalThis.addEventListener('keydown', this._keydownHandler, { capture: true, passive: true });
    globalThis.addEventListener('keyup', this._keyupHandler, { capture: true, passive: true });
    stage.canvas.addEventListener('wheel', this._wheelHandler, { capture: true, passive: false });
  }

  destroy() {
    globalThis.removeEventListener('keydown', this._keydownHandler, true);
    globalThis.removeEventListener('keyup', this._keyupHandler, true);
    this.stage.canvas.removeEventListener('wheel', this._wheelHandler, false);
  }

  private _getKey(key: string): string {
    return this.ignoreCase ? key.toLowerCase() : key;
  }

  private _onKeydown(e: KeyboardEvent) {
    const key = this._getKey(e.key);
    this._keyMap[key] = true;
    this.stage.emit(EventType.keydown, e);
  }

  private _onKeyup(e: KeyboardEvent) {
    const key = this._getKey(e.key);
    this._keyMap[key] = false;
    this.stage.emit(EventType.keyup, e);
  }

  private _onWheel(e: WheelEvent) {
    e.preventDefault();
    this.stage.emit(EventType.wheel, e);
  }

  /**
   * 是否按下了某个键盘
   * @param key 键名，根据 ignoreCase 属性决定是否区分大小写
   */
  hasKeydown(key: string) {
    const normalizedKey = this._getKey(key);
    return this._keyMap[normalizedKey] === true;
  }
}
