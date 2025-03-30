import type { IScene } from "../nodes/scene";
import type { Node } from "../nodes/node";
import type { Stage } from "../nodes/stage";

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

  private _awaked = false;
  /** 是否激活过，添加到场景后，会被激活 */
  get awaked(): boolean {
    return this._awaked;
  }

  private _destroyed = false;
  /** 是否销毁了 */
  get destroyed(): boolean {
    return this._destroyed;
  }

  private _enabled = true;
  /** 是否启用脚本，不启用则脚本不被执行，改变状态会回调 onEnable 和 onDisable */
  get enabled(): boolean {
    return this._enabled;
  }
  set enabled(value: boolean) {
    if (value !== this._enabled) {
      this._enabled = value;
      if (this._target) {
        value ? this.onEnable() : this.onDisable();
      }
    }
  }

  private _target?: Node;
  /** 脚本目标对象，设置 target 后回调 onCreate */
  get target(): Node {
    if (!this._target) {
      console.warn("Script target is not set");
    }
    return this._target as Node;
  }
  set target(value: Node) {
    if (value !== this._target) {
      this._target = value;
      if (value) {
        this.onCreate();
      }
    }
  }

  /** target 的 stage 引用 */
  get stage(): Stage | undefined {
    return this._target?.stage;
  }

  /** target 的 scene 引用（使用时尽量引用成局部变量，减少遍历获取） */
  get scene(): IScene | undefined {
    return this._target?.scene;
  }

  /**
   * 销毁脚本，脚本被销毁后，不再可用，回调 onDestroy
   * 脚本销毁时，target、root、scene、stage、timer 上的所有监听都会被自动取消，如果还监听 Timer.system 需要自己手动取消
   */
  destroy(): void {
    if (this._destroyed) return;

    this._destroyed = true;
    this._enabled = false;
    this.onDestroy();

    this._target?.offAll(this);
    this.scene?.offAll(this);
    this.stage?.offAll(this);
    this.stage?.timer.clearAll(this);
    this._target = undefined;
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
   * 更新脚本，回调 onUpdate
   * @param delta - 距离上一帧的时间间隔
   */
  update(delta: number): void {
    // TODO 这里可以做性能优化，比如有 update 的时候才执行
    if (!this._enabled) return;

    if (!this._awaked) {
      this.awake();
    }

    this.onUpdate(delta);
  }

  /**
   * 激活脚本（第一次执行），回调 onAwake
   */
  awake(): void {
    if (!this._awaked) {
      this._awaked = true;
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
  // @ts-expect-error 此方法预期会被子类重写
  onUpdate(delta: number): void {}
  /**
   * 脚本被销毁时触发
   */
  onDestroy(): void {}
}
