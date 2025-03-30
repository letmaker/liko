import type { IAnimation, IScene } from "../nodes/scene";
import type { Node } from "../nodes/node";
import type { Stage } from "../nodes/stage";

/**
 * 节点扩展脚本，可以放到时间轴内或者延迟执行
 * 生命周期：onCreate(设置 target 时执行) > onAwake(delay 后第一次被执行时，只执行一次) > onStart(每次启动)> onUpdate(每次更新) > onEnd(每次结束)
 * 改变 enable 时，会触发 onEnable 或者 onDisable
 * 脚本被销毁时，调用 onDestroy
 */
export abstract class Script {
  /** id 一般由编辑器指定 */
  id = "";
  /** 脚本标签，方便标识 */
  label = "";
  /** 是否已经开始 */
  started = false;
  /** 是否已经结束 */
  ended = false;

  private _awaked = false;
  /** 是否激活过 */
  get awaked(): boolean {
    return this._awaked;
  }

  private _destroyed = false;
  /** 是否销毁了 */
  get destroyed(): boolean {
    return this._destroyed;
  }

  private _delay = 0;
  /** 延迟执行时间，单位为秒 */
  get delay(): number {
    return this._delay;
  }
  set delay(value: number) {
    this._delay = value;
  }

  private _enabled = true;
  /** 是否启用脚本，不启用则脚本不被执行，改变状态会回调 onEnable 和 onDisable */
  get enabled(): boolean {
    return this._enabled;
  }
  set enabled(value) {
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
    return this._target as Node;
  }
  set target(value: Node) {
    if (value !== this._target) {
      this._target = value;
      value && this.onCreate();
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
    if (!this._destroyed) {
      this._destroyed = true;
      this._enabled = false;
      this._target?.offAll(this);
      this.scene?.offAll(this);
      this.stage?.offAll(this);
      this.stage?.timer.clearAll(this);
      this.onDestroy();
      this._target = undefined;
    }
  }

  /**
   * 通过数据设置属性
   * @param props 属性列表
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
   */
  setProp(key: string, value: any) {
    if (key in this) (this as any)[key] = value;
  }

  /**
   * 更新脚本，回调 onUpdate
   * @param currTime 当前场景时间
   */
  update(currTime: number): void {
    if (this._enabled && currTime >= this._delay) {
      if (!this.ended) {
        this._awaked || this.awake();
        this.started || this.start();
        // 脚本没有持续时间，开始和结束是同时的
        this.end();
      }
      this.onUpdate(currTime);
    }
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
   * 开始脚本，回调 onStart
   */
  start(): void {
    if (!this.started) {
      this.started = true;
      this.onStart();
    }
  }

  /**
   * 结束脚本，回调 onEnd
   */
  end(): void {
    if (!this.ended) {
      this.ended = true;
      this.onEnd();
    }
  }

  /**
   * 执行脚本到某个时间，可能会重置 started 状态
   * @param time 场景时间
   */
  goto(time: number): void {
    if (!this._enabled || this.destroyed) return;
    this.started = time > this._delay;
    // 脚本没有持续时长，开始和结束时同时的
    this.ended = this.started;
    this.update(time);
  }

  /**
   * 重置脚本 started 和 ended 状态（当 time < this.delay 时)
   * @param time 场景时间
   */
  reset(time: number): void {
    if (time < this.delay) {
      this.started = false;
      this.ended = false;
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
   * 每次脚本开始执行时触发
   */
  onStart(): void {}
  /**
   * 每次脚本结束执行时触发
   */
  onEnd(): void {}
  /**
   * 脚本被 update 时触发
   * @param time 当前场景时间
   */
  // @ts-expect-error
  onUpdate(time: number): void {}
  /**
   * 脚本被销毁时触发
   */
  onDestroy(): void {}
}
