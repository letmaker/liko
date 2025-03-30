// @ts-nocheck
import { EventType, type Node } from "..";
import type { MouseEvent } from "../events/mouse-event";
import type { RigidBody } from "../physics/rigidBody";
import type { Store } from "../utils/store";
import type { Blueprint } from "./blueprint";
import { Effect } from "./effect/effect";
import { ScriptBase } from "./script-base";

/** 碰撞信息 */
export interface ICollision {
  /** 被碰撞 RigidBody */
  other: RigidBody;
  /** 碰撞信息 */
  contact: { normal: { x: number; y: number; z: number } };
}

/**
 * 图块
 */
export class Script extends ScriptBase {
  override awake(): void {
    if (!this.awaked) {
      this._regEvent();
      super.awake();
    }
  }

  private _regEvent(): void {
    const prototype = ScriptBase.prototype;
    const target = this.target;
    if (target) {
      // 鼠标事件
      if (this.onClick !== prototype.onClick) {
        target.on(EventType.click, this.onClick, this);
      }
      if (this.onMouseDown !== prototype.onMouseDown) {
        target.on(EventType.mousedown, this.onMouseDown, this);
      }
      if (this.onMouseUp !== prototype.onMouseUp) {
        target.on(EventType.mouseup, this.onMouseUp, this);
      }
      if (this.onMouseMove !== prototype.onMouseMove) {
        target.on(EventType.mousemove, this.onMouseMove, this);
      }

      // 键盘事件
      if (this.onKeyDown !== prototype.onKeyDown) {
        this.stage?.on(EventType.keydown, this.onKeyDown.bind(this));
      }
      if (this.onKeyUp !== prototype.onKeyUp) {
        this.stage?.on(EventType.keyup, this.onKeyUp.bind(this));
      }

      // 物理事件
      if (this.onCollisionStart !== prototype.onCollisionStart) {
        target.on(EventType.collisionStart, this.onCollisionStart, this);
      }
      if (this.onCollisionEnd !== prototype.onCollisionEnd) {
        target.on(EventType.collisionEnd, this.onCollisionEnd, this);
      }
    }
  }

  /**
   * target被点击时触发
   * @param e 鼠标事件对象
   */
  onClick(e: MouseEvent): void {}
  /**
   * target在鼠标按下时触发
   * @param e 鼠标事件对象
   */
  onMouseDown(e: MouseEvent): void {}
  /**
   * target在鼠标抬起时触发
   * @param e 鼠标事件对象
   */
  onMouseUp(e: MouseEvent): void {}
  /**
   * target在鼠标移动时触发
   * @param e 鼠标事件对象
   */
  onMouseMove(e: MouseEvent): void {}

  /**
   * 键盘按下时
   * @param key 键盘按键
   */
  onKeyDown(e: KeyboardEvent): void {}
  /**
   * 键盘抬起时
   * @param key 键盘按键
   */
  onKeyUp(e: KeyboardEvent): void {}

  /**
   * 物理碰撞开始时触发
   * @param e 碰撞事件对象
   */
  onCollisionStart(e: ICollision): void {}
  /**
   * 物理碰撞结束时触发
   * @param e 碰撞事件对象
   */
  onCollisionEnd(e: ICollision): void {}
}
