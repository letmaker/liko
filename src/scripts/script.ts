import { EventType } from "../const";
import type { MouseEvent } from "../events/mouse-event";
import type { RigidBody } from "../physics/rigidBody";
import { ScriptBase } from "./script-base";

/**
 * 碰撞信息接口
 */
export interface ICollision {
  /** 被碰撞的刚体对象 */
  other: RigidBody;
  /** 碰撞接触信息，包含法线向量 */
  contact: { normal: { x: number; y: number; z: number } };
}

/**
 * 脚本类，用于处理游戏对象的行为逻辑
 * @extends ScriptBase
 */
export class Script extends ScriptBase {
  override _$awake(): void {
    if (!this.awaked) {
      this._$regEvent();
      super._$awake();
    }
  }

  private _$regEvent(): void {
    const prototype = Script.prototype;
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

      // 物理事件
      if (this.onCollisionStart !== prototype.onCollisionStart) {
        target.on(EventType.collisionStart, this.onCollisionStart, this);
      }
      if (this.onCollisionEnd !== prototype.onCollisionEnd) {
        target.on(EventType.collisionEnd, this.onCollisionEnd, this);
      }

      // 信号事件
      if (this.onSignal !== prototype.onSignal) {
        this.scene?.on(EventType.signal, this.onSignal, this);
      }

      const { stage } = this;
      if (stage) {
        // stage 事件
        if (this.onStageClick !== prototype.onStageClick) {
          stage.on(EventType.click, this.onStageClick, this);
        }
        if (this.onStageMouseDown !== prototype.onStageMouseDown) {
          stage.on(EventType.mousedown, this.onStageMouseDown, this);
        }
        if (this.onStageMouseUp !== prototype.onStageMouseUp) {
          stage.on(EventType.mouseup, this.onStageMouseUp, this);
        }
        if (this.onStageMouseMove !== prototype.onStageMouseMove) {
          stage.on(EventType.mousemove, this.onStageMouseMove, this);
        }

        // 键盘事件
        if (this.onKeyDown !== prototype.onKeyDown) {
          stage.on(EventType.keydown, this.onKeyDown, this);
        }
        if (this.onKeyUp !== prototype.onKeyUp) {
          stage.on(EventType.keyup, this.onKeyUp, this);
        }
      }
    }
  }

  /**
   * 目标被点击时触发
   * @param e 鼠标事件对象
   */
  // @ts-expect-error
  onClick(e: MouseEvent): void {}

  /**
   * 目标在鼠标按下时触发
   * @param e 鼠标事件对象
   */
  // @ts-expect-error
  onMouseDown(e: MouseEvent): void {}

  /**
   * 目标在鼠标抬起时触发
   * @param e 鼠标事件对象
   */
  // @ts-expect-error
  onMouseUp(e: MouseEvent): void {}

  /**
   * 目标在鼠标移动时触发
   * @param e 鼠标事件对象
   */
  // @ts-expect-error
  onMouseMove(e: MouseEvent): void {}

  /**
   * 物理碰撞开始时触发
   * @param e 碰撞事件对象
   */
  // @ts-expect-error
  onCollisionStart(e: ICollision): void {}

  /**
   * 物理碰撞结束时触发
   * @param e 碰撞事件对象
   */
  // @ts-expect-error
  onCollisionEnd(e: ICollision): void {}

  /**
   * 同场景的脚本调用 signal 时触发，方便同场景脚本间的通信
   */
  // @ts-expect-error
  onSignal(type: string, params?: Record<string, any>): void {}

  /**
   * 目标被点击时触发
   * @param e 鼠标事件对象
   */
  // @ts-expect-error
  onStageClick(e: MouseEvent): void {}

  /**
   * 目标在鼠标按下时触发
   * @param e 鼠标事件对象
   */
  // @ts-expect-error
  onStageMouseDown(e: MouseEvent): void {}

  /**
   * 目标在鼠标抬起时触发
   * @param e 鼠标事件对象
   */
  // @ts-expect-error
  onStageMouseUp(e: MouseEvent): void {}

  /**
   * 目标在鼠标移动时触发
   * @param e 鼠标事件对象
   */
  // @ts-expect-error
  onStageMouseMove(e: MouseEvent): void {}

  /**
   * 键盘按下时触发
   * @param e 键盘事件对象
   */
  // @ts-expect-error
  onKeyDown(e: KeyboardEvent): void {}

  /**
   * 键盘抬起时触发
   * @param e 键盘事件对象
   */
  // @ts-expect-error
  onKeyUp(e: KeyboardEvent): void {}
}
