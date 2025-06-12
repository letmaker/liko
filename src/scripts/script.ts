import { EventType } from '../const';
import type { LikoPointerEvent } from '../events/pointer-event';
import type { LikoNode } from '../nodes/node';
import type { RigidBody } from '../physics/rigidBody';
import { BaseScript } from './base-script';

/**
 * 物理碰撞事件信息，当游戏对象发生物理碰撞时，系统会传递此接口类型的对象给碰撞回调函数
 */
export interface ICollision {
  /** 与当前刚体发生碰撞的其他刚体对象 */
  other: RigidBody;
  /** 碰撞点的接触信息，包含碰撞法线向量，用于计算碰撞反弹方向 */
  contact: { normal: { x: number; y: number; z: number } };
}

/**
 * 游戏对象行为脚本基类，提供完整的事件处理和生命周期管理
 *
 * 继承自 BaseScript，为游戏对象添加丰富的事件响应能力，包括：
 * - 指针事件（点击、按下、抬起、移动）
 * - 物理碰撞事件（开始碰撞、结束碰撞）
 * - 场景间通信事件（signal）
 * - 全局输入事件（键盘按键）
 * - 舞台级别事件（全局指针事件）
 *
 * @example
 * ```typescript
 * // 创建一个基础的游戏脚本
 * class PlayerScript extends Script<Player> {
 *   onAwake() {
 *     console.log('玩家对象已唤醒');
 *   }
 *
 *   onClick(e: LikoPointerEvent) {
 *     console.log('玩家被点击了');
 *     this.target.position.x += 10;
 *   }
 *
 *   onCollisionStart(collision: ICollision) {
 *     console.log('玩家撞到了:', collision.other);
 *     // 根据碰撞法线计算反弹
 *     const normal = collision.contact.normal;
 *     this.target.velocity.x = -normal.x * 100;
 *   }
 *
 *   onKeyDown(e: KeyboardEvent) {
 *     if (e.key === 'Space') {
 *       this.target.jump();
 *     }
 *   }
 *
 *   onSignal(type: string, params?: Record<string, unknown>) {
 *     if (type === 'gameOver') {
 *       this.target.visible = false;
 *     }
 *   }
 * }
 *
 * // 将脚本附加到游戏对象
 * const player = new Player();
 * const script = new PlayerScript();
 * player.addScript(script);
 * ```
 *
 * @remarks
 * - 所有事件处理方法都是可选的，只需重写需要的方法即可
 * - 事件系统采用自动注册机制，无需手动绑定事件
 * - 物理碰撞事件需要对象具有刚体组件才能触发
 * - 信号事件在整个场景范围内有效，可用于跨对象通信
 * - 舞台事件是全局的，不受对象层级影响
 */
export class Script<T extends LikoNode = LikoNode> extends BaseScript<T> {
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
      const { onClick, onPointerDown, onPointerUp, onPointerMove, onCollisionStart, onCollisionEnd, onSignal } =
        prototype;
      // 指针事件
      if (this.onClick !== onClick) {
        target.on(EventType.click, this.onClick, this);
      }
      if (this.onPointerDown !== onPointerDown) {
        target.on(EventType.pointerDown, this.onPointerDown, this);
      }
      if (this.onPointerUp !== onPointerUp) {
        target.on(EventType.pointerUp, this.onPointerUp, this);
      }
      if (this.onPointerMove !== onPointerMove) {
        target.on(EventType.pointerMove, this.onPointerMove, this);
      }

      // 物理事件
      if (this.onCollisionStart !== onCollisionStart) {
        target.on(EventType.collisionStart, this.onCollisionStart, this);
      }
      if (this.onCollisionEnd !== onCollisionEnd) {
        target.on(EventType.collisionEnd, this.onCollisionEnd, this);
      }

      // 信号事件
      if (this.onSignal !== onSignal) {
        this.scene?.on(EventType.signal, this.onSignal, this);
      }

      const { stage } = this;
      if (stage) {
        const { onStageClick, onStagePointerDown, onStagePointerUp, onStagePointerMove, onKeyDown, onKeyUp } =
          prototype;
        // stage 事件
        if (this.onStageClick !== onStageClick) {
          stage.on(EventType.click, this.onStageClick, this);
        }
        if (this.onStagePointerDown !== onStagePointerDown) {
          stage.on(EventType.pointerDown, this.onStagePointerDown, this);
        }
        if (this.onStagePointerUp !== onStagePointerUp) {
          stage.on(EventType.pointerUp, this.onStagePointerUp, this);
        }
        if (this.onStagePointerMove !== onStagePointerMove) {
          stage.on(EventType.pointerMove, this.onStagePointerMove, this);
        }

        // 键盘事件
        if (this.onKeyDown !== onKeyDown) {
          stage.on(EventType.keydown, this.onKeyDown, this);
        }
        if (this.onKeyUp !== onKeyUp) {
          stage.on(EventType.keyup, this.onKeyUp, this);
        }
      }
    }
  }

  /**
   * 当绑定的目标对象被点击时触发
   *
   * @param e - 指针事件对象，包含点击位置、按钮信息等
   *
   * @remarks
   * - 只有当对象可交互且未被遮挡时才会触发
   * - 可以通过事件对象获取点击的屏幕坐标和世界坐标
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onClick(e: LikoPointerEvent): void {}

  /**
   * 当指针在目标对象上按下时触发
   *
   * @param e - 指针事件对象，包含按下位置、按钮类型等信息
   *
   * @remarks
   * - 在 onClick 事件之前触发
   * - 适用于拖拽开始、长按检测等场景
   * - 支持鼠标左键、右键、中键的区分
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onPointerDown(e: LikoPointerEvent): void {}

  /**
   * 当指针在目标对象上抬起时触发
   *
   * @param e - 指针事件对象，包含抬起位置、按钮类型等信息
   *
   * @remarks
   * - 适用于拖拽结束、按钮释放等场景
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onPointerUp(e: LikoPointerEvent): void {}

  /**
   * 当指针在目标对象上移动时触发
   *
   * @param e - 指针事件对象，包含移动位置、移动增量等信息
   *
   * @remarks
   * - 高频触发事件，注意性能优化
   * - 适用于鼠标悬停效果、拖拽移动、实时跟踪等场景
   * - 可以通过事件对象获取移动的增量值
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onPointerMove(e: LikoPointerEvent): void {}

  /**
   * 当目标对象开始与其他刚体发生物理碰撞时触发
   *
   * @param collision - 碰撞信息对象，包含碰撞对象和接触点信息
   *
   * @remarks
   * - 需要目标对象具有 RigidBody 组件才能触发
   * - 适用于碰撞检测、触发器响应、伤害计算等场景
   * - 碰撞法线可用于计算反弹方向和力度
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onCollisionStart(collision: ICollision): void {}

  /**
   * 当目标对象结束与其他刚体的物理碰撞时触发
   *
   * @param collision - 碰撞信息对象，包含分离的碰撞对象信息
   *
   * @remarks
   * - 与 onCollisionStart 成对出现
   * - 适用于碰撞状态重置、离开触发器等场景
   * - 可用于停止碰撞相关的持续效果
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onCollisionEnd(collision: ICollision): void {}

  /**
   * 当场景中的其他对象发送信号时触发
   *
   * @param type - 信号类型标识符，用于区分不同的信号
   * @param params - 可选的信号参数对象，用于传递额外数据
   *
   * @remarks
   * - 用于跨对象、跨脚本的通信
   * - 信号在整个场景范围内广播
   * - 适用于游戏状态变化、全局事件通知等场景
   * - 发送信号使用：this.scene.emit(EventType.signal, type, params)
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onSignal(type: string, params?: Record<string, unknown>): void {}

  /**
   * 当舞台（全局画布）被点击时触发
   *
   * @param e - 指针事件对象，包含全局点击位置信息
   *
   * @remarks
   * - 全局事件，不受对象层级限制
   * - 即使点击空白区域也会触发
   * - 适用于全局UI交互、背景点击处理等场景
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onStageClick(e: LikoPointerEvent): void {}

  /**
   * 当在舞台（全局画布）上按下指针时触发
   *
   * @param e - 指针事件对象，包含全局按下位置信息
   *
   * @remarks
   * - 全局事件，不受对象层级限制
   * - 适用于全局拖拽开始、右键菜单等场景
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onStagePointerDown(e: LikoPointerEvent): void {}

  /**
   * 当在舞台（全局画布）上抬起指针时触发
   *
   * @param e - 指针事件对象，包含全局抬起位置信息
   *
   * @remarks
   * - 全局事件，不受对象层级限制
   * - 适用于全局拖拽结束、右键菜单关闭等场景
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onStagePointerUp(e: LikoPointerEvent): void {}

  /**
   * 当在舞台（全局画布）上移动指针时触发
   *
   * @param e - 指针事件对象，包含全局移动位置信息
   *
   * @remarks
   * - 高频全局事件，注意性能优化
   * - 适用于全局鼠标跟踪、十字准星、全局UI响应等场景
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onStagePointerMove(e: LikoPointerEvent): void {}

  /**
   * 当键盘按键被按下时触发
   *
   * @param e - 标准键盘事件对象，包含按键信息、修饰键状态等
   *
   * @remarks
   * - 全局键盘事件，不受对象焦点影响
   * - 适用于游戏控制、快捷键响应、输入处理等场景
   * - 可以通过 e.key、e.code、e.keyCode 获取按键信息
   * - 支持修饰键检测：e.ctrlKey、e.shiftKey、e.altKey
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onKeyDown(e: KeyboardEvent): void {}

  /**
   * 当键盘按键被抬起时触发
   *
   * @param e - 标准键盘事件对象，包含按键信息、修饰键状态等
   *
   * @remarks
   * - 与 onKeyDown 成对出现
   * - 适用于按键释放检测、组合键处理、输入完成等场景
   * - 对于需要持续响应的按键，建议使用输入管理器而非键盘事件
   */
  // @ts-expect-error
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  onKeyUp(e: KeyboardEvent): void {}
}
