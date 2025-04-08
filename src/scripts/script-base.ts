import type { IScene } from "../nodes/scene";
import type { Node } from "../nodes/node";
import type { Stage } from "../nodes/stage";
import { EventType } from "../const";

/**
 * 节点扩展脚本，扩展 node 的功能
 * 生命周期：onCreate(设置 target 时执行) > onAwake(添加到场景后，只执行一次) > onUpdate(每次更新) > onDestroy(销毁时执行)
 * 改变 enable 时，会触发 onEnable 或者 onDisable
 */
export abstract class ScriptBase {
  /** id 一般由编辑器指定 */
  id = "";
  /** 脚本标签，方便标识 */
  label = "";

  private _$awaked = false;
  /** 是否激活过，添加到场景后，会被激活 */
  get awaked(): boolean {
    return this._$awaked;
  }

  private _$destroyed = false;
  /** 是否销毁了 */
  get destroyed(): boolean {
    return this._$destroyed;
  }

  private _$enabled = true;
  /** 是否启用脚本，不启用则脚本不被执行，改变状态会回调 onEnable 和 onDisable */
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

  private _$target?: Node;
  /** 脚本目标对象，设置 target 后回调 onCreate */
  get target(): Node {
    if (!this._$target) {
      console.warn("Script target is not set");
    }
    return this._$target as Node;
  }
  set target(value: Node) {
    if (value !== this._$target) {
      this._$target = value;
      if (value) {
        this.onCreate();
      }
    }
  }

  /** target 的 stage 引用 */
  get stage(): Stage | undefined {
    return this._$target?.stage;
  }

  /** target 的 scene 引用（使用时尽量引用成局部变量，减少遍历获取） */
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
   * 发送信号，所有信号可以在 script 的 onSignal 内被监听到，用于脚本及节点之间的消息通信
   * @param type 事件名称，不区分大小写
   * @param args 可选参数，支持多个，以逗号隔开
   */
  signal(key: string, ...args: any[]): void {
    if (this._$target) {
      this._$target.emit(EventType.signal, key, this, ...args);
    }
  }

  /**
   * 更新脚本，回调 onUpdate
   * @param delta - 距离上一帧的时间间隔
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
   * 销毁脚本，脚本被销毁后，不再可用，回调 onDestroy
   * 脚本销毁时，target、root、scene、stage、timer 上的所有监听都会被自动取消，如果还监听 Timer.system 需要自己手动取消
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
