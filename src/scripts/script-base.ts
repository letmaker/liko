import { EventType } from "../const";
import type { LikoNode } from "../nodes/node";
import type { IScene } from "../nodes/scene";
import type { Stage } from "../nodes/stage";

/**
 * 节点扩展脚本基类，用于扩展 node 的功能
 *
 * @remarks
 * 生命周期顺序：
 * 1. onCreate - 设置 target 时执行
 * 2. onAwake - 添加到场景后执行一次
 * 3. onUpdate - 每帧更新时执行
 * 4. onDestroy - 销毁时执行
 *
 * 当 enable 状态改变时，会触发 onEnable 或 onDisable
 */
export abstract class ScriptBase {
  /** 脚本唯一标识符，通常由编辑器指定 */
  id = "";
  /** 脚本标签，用于快速识别和查找 */
  label = "";

  private _$awaked = false;
  /** 脚本是否已被激活（添加到场景后触发） */
  get awaked(): boolean {
    return this._$awaked;
  }

  private _$destroyed = false;
  /** 脚本是否已被销毁 */
  get destroyed(): boolean {
    return this._$destroyed;
  }

  private _$enabled = true;
  /** 脚本是否启用，禁用时不执行更新且触发 onDisable */
  get enabled(): boolean {
    return this._$enabled;
  }
  set enabled(value: boolean) {
    if (value !== this._$enabled) {
      this._$enabled = value;
      if (this._$target) {
        value ? this.onEnable() : this.onDisable();
      }
    }
  }

  private _$target?: LikoNode;
  /** 脚本挂载的目标节点，设置后触发 onCreate */
  get target(): LikoNode {
    if (!this._$target) {
      console.warn("Script target is not set");
    }
    return this._$target as LikoNode;
  }
  set target(value: LikoNode) {
    if (value !== this._$target) {
      this._$target = value;
      if (value) {
        this.onCreate();
      }
    }
  }

  /** 目标节点所在的舞台引用 */
  get stage(): Stage | undefined {
    return this._$target?.stage;
  }

  /** 目标节点所在的场景引用（建议缓存为局部变量以提高性能） */
  get scene(): IScene | undefined {
    return this._$target?.scene;
  }

  /**
   * 通过数据设置属性
   * @param props - 属性列表
   * @returns 当前实例，支持链式调用
   */
  setProps(props?: Record<string, unknown>): this {
    if (props) {
      const keys = Object.keys(props);
      for (const key of keys) {
        this.setProp(key, props[key]);
      }
    }
    return this;
  }

  /**
   * 设置属性
   * @param key - 属性名
   * @param value - 属性值
   */
  setProp(key: string, value: unknown): void {
    if (key in this) {
      (this as Record<string, unknown>)[key] = value;
    }
  }

  /**
   * 向同场景的其他脚本发送信号
   *
   * @remarks
   * 发送的信号可以在同场景其他脚本的 onSignal 方法中被监听到，用于场景内脚本间通信。
   * 注意：必须在脚本销毁前发送信号，否则无法正确触发。
   *
   * @param key - 信号类型标识符，不区分大小写
   * @param params - 可选的信号参数对象
   */
  signal(key: string, params?: Record<string, any>): void {
    this._$target?.scene?.emit(EventType.signal, key, params);
  }

  /**
   * 执行脚本的更新逻辑
   *
   * @remarks
   * 每帧调用一次，用于更新脚本状态。如果脚本未启用或未激活则不会执行。
   *
   * @param delta - 距离上一帧的时间间隔（毫秒）
   */
  update(delta: number): void {
    // TODO 这里可以做性能优化，比如有 update 的时候才执行
    if (!this._$enabled) return;

    if (!this._$awaked) {
      this._$awake();
    }

    this.onUpdate(delta);
  }

  /**
   * 激活脚本（第一次执行），回调 onAwake
   */
  protected _$awake(): void {
    if (!this._$awaked) {
      this._$awaked = true;
      this.onAwake();
    }
  }

  /**
   * enable 设置为 true 时触发
   */
  onEnable(): void {}
  /**
   * enable 设置为 false 时触发
   */
  onDisable(): void {}
  /**
   * target 被设置时触发
   */
  onCreate(): void {}
  /**
   * 第一次被执行时触发，只触发一次
   */
  onAwake(): void {}
  /**
   * 脚本被 update 时触发
   * @param delta - 距离上一帧的时间间隔
   */
  // @ts-expect-error
  onUpdate(delta: number): void {}
  /**
   * 脚本被销毁时触发
   */
  onDestroy(): void {}

  /**
   * 销毁脚本实例
   *
   * @remarks
   * 销毁后脚本将不再可用，会自动：
   * - 触发 onDestroy 回调
   * - 清除在 target、scene、stage、timer 上的所有监听
   * - 解除与目标节点的关联
   *
   * 注意：如果使用了 Timer.system 的监听，需要手动清除
   */
  destroy(): void {
    if (this._$destroyed) return;

    this._$destroyed = true;
    this._$enabled = false;
    this.onDestroy();

    this._$target?.offAll(this);
    this.scene?.offAll(this);
    this.stage?.offAll(this);
    this.stage?.timer.clearAll(this);
    this._$target = undefined;
  }
}
