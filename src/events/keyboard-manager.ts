import { EventType } from "../const";
import type { Stage } from "../nodes/stage";

/**
 * 键盘管理器
 */
export class KeyBoardManager {
  private _keydownHandler = this._onKeydown.bind(this);
  private _keyupHandler = this._onKeyup.bind(this);
  private _wheelHandler = this._onWheel.bind(this);

  keyMap: Record<string, boolean> = {};

  constructor(public stage: Stage) {
    globalThis.addEventListener("keydown", this._keydownHandler, { capture: true, passive: true });
    globalThis.addEventListener("keyup", this._keyupHandler, { capture: true, passive: true });
    stage.canvas.addEventListener("wheel", this._wheelHandler, { capture: true, passive: false });
  }

  destroy() {
    globalThis.removeEventListener("keydown", this._keydownHandler, true);
    globalThis.removeEventListener("keyup", this._keyupHandler, true);
    this.stage.canvas.removeEventListener("wheel", this._wheelHandler, false);
  }

  private _onKeydown(e: KeyboardEvent) {
    this.keyMap[e.key] = true;
    this.stage.emit(EventType.keydown, e);
  }

  private _onKeyup(e: KeyboardEvent) {
    this.keyMap[e.key] = false;
    this.stage.emit(EventType.keyup, e);
  }

  private _onWheel(e: WheelEvent) {
    e.preventDefault();
    this.stage.emit(EventType.wheel, e);
  }

  /**
   * 是否按下了某个键盘
   * @param key 区分大小写
   */
  hasKeydown(key: string) {
    return this.keyMap[key] === true;
  }
}
