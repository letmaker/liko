import { EventType } from "../const";
import type { LikoPointerEvent } from "../events/pointer-event";
import type { RigidBody } from "../physics/rigidBody";
import { ScriptBase } from "./script-base";

/** 物理碰撞事件信息 */
export interface ICollision {
  /** 与当前刚体发生碰撞的其他刚体对象 */
  other: RigidBody;
  /** 碰撞点的接触信息，包含碰撞法线向量 */
  contact: { normal: { x: number; y: number; z: number } };
}

/**
 * 游戏对象行为脚本基类，提供事件处理和生命周期管理
 *
 * 继承自 ScriptBase，为游戏对象添加事件响应能力，包括：
 * - 鼠标事件（点击、按下、抬起、移动）
 * - 物理碰撞事件（开始碰撞、结束碰撞）
 * - 场景间通信事件（signal）
 * - 全局输入事件（键盘按键）
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
      if (this.onPointerDown !== prototype.onPointerDown) {
        target.on(EventType.pointerdown, this.onPointerDown, this);
      }
      if (this.onPointerUp !== prototype.onPointerUp) {
        target.on(EventType.pointerup, this.onPointerUp, this);
      }
      if (this.onPointerMove !== prototype.onPointerMove) {
        target.on(EventType.pointermove, this.onPointerMove, this);
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
        if (this.onStagePointerDown !== prototype.onStagePointerDown) {
          stage.on(EventType.pointerdown, this.onStagePointerDown, this);
        }
        if (this.onStagePointerUp !== prototype.onStagePointerUp) {
          stage.on(EventType.pointerup, this.onStagePointerUp, this);
        }
        if (this.onStagePointerMove !== prototype.onStagePointerMove) {
          stage.on(EventType.pointermove, this.onStagePointerMove, this);
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
   * target 被点击时触发的回调函数
   * @param e - 鼠标事件对象
   */
  // @ts-expect-error
  onClick(e: LikoPointerEvent): void {}

  /**
   * 当鼠标在 target 上按下时触发的回调函数
   * @param e - 鼠标事件对象
   */
  // @ts-expect-error
  onPointerDown(e: LikoPointerEvent): void {}

  /**
   * 当鼠标在 target 上抬起时触发的回调函数
   * @param e - 鼠标事件对象
   */
  // @ts-expect-error
  onPointerUp(e: LikoPointerEvent): void {}

  /**
   * 当鼠标在 target 上移动时触发的回调函数
   * @param e - 鼠标事件对象
   */
  // @ts-expect-error
  onPointerMove(e: LikoPointerEvent): void {}

  /**
   * target 开始与其他物体发生物理碰撞时触发的回调函数
   * @param e - 碰撞事件对象
   */
  // @ts-expect-error
  onCollisionStart(e: ICollision): void {}

  /**
   * target 结束与其他物体的物理碰撞时触发的回调函数
   * @param e - 碰撞事件对象
   */
  // @ts-expect-error
  onCollisionEnd(e: ICollision): void {}

  /**
   * 当同场景中的其他脚本发送信号时触发的回调函数
   * @param type - 信号类型标识符
   * @param params - 可选的信号参数对象
   */
  // @ts-expect-error
  onSignal(type: string, params?: Record<string, any>): void {}

  /**
   * 当舞台（Stage）被点击时触发的回调函数
   * @param e - 鼠标事件对象
   */
  // @ts-expect-error
  onStageClick(e: LikoPointerEvent): void {}

  /**
   * 当在舞台（Stage）上按下鼠标时触发的回调函数
   * @param e - 鼠标事件对象
   */
  // @ts-expect-error
  onStagePointerDown(e: LikoPointerEvent): void {}

  /**
   * 当在舞台（Stage）上抬起鼠标时触发的回调函数
   * @param e - 鼠标事件对象
   */
  // @ts-expect-error
  onStagePointerUp(e: LikoPointerEvent): void {}

  /**
   * 当在舞台（Stage）上移动鼠标时触发的回调函数
   * @param e - 鼠标事件对象
   */
  // @ts-expect-error
  onStagePointerMove(e: LikoPointerEvent): void {}

  /**
   * 当键盘按键被按下时触发的回调函数
   * @param e - 键盘事件对象
   */
  // @ts-expect-error
  onKeyDown(e: KeyboardEvent): void {}

  /**
   * 当键盘按键被抬起时触发的回调函数
   * @param e - 键盘事件对象
   */
  // @ts-expect-error
  onKeyUp(e: KeyboardEvent): void {}
}
