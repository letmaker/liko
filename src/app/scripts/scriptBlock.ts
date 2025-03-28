// @ts-nocheck
import type { Node } from "..";
import type { MouseEvent } from "../events/mouse-event";
import type { RigidBody } from "../physics/rigidBody";
import { Register } from "../utils/register";
import type { Store } from "../utils/store";
import type { Blueprint } from "./blueprint";
import { Effect } from "./effect/effect";
import { Script } from "./script";

/** 碰撞信息 */
export interface ICollision {
  /** 被碰撞 RigidBody */
  other: RigidBody;
  /** 碰撞信息 */
  contact: { normal: { x: number; y: number; z: number } };
}

/** 数据参数，支持全局变量：store，蓝图局部变量：data 和节点属性三种 */
export interface IValueData {
  type: "store" | "data" | "node";
  key?: string;
  value?: string | string[];
}

/** 输入或输出到图块的接口 */
export interface ISignal {
  id: string;
  signal: string;
  params?: Record<string, IValueData | number | string | boolean>;
}

/**
 * 图块 = 蓝图逻辑单元，大量图块通过连线，形成蓝图
 */
export class ScriptBlock extends Script {
  /** 蓝图 */
  blueprint!: Blueprint;
  /** 输出映射 */
  outputs: { [signal: string]: Array<ISignal> } = {};
  /** 蓝图变量(局部变量) */
  get store(): Store {
    return this.blueprint?.store;
  }

  override destroy(): void {
    if (!this.destroyed) {
      this.outputs = {};
      super.destroy();
    }
  }

  setProp(key: string, value: any): void {
    (this as any)[key] = this._getValue(this, key, value);
  }

  /** 根据输入值获取值 */
  private _getValue(
    obj: any,
    key: string,
    jsonValue: {
      callee: string;
      value: any;
      default: any;
    },
  ): any {
    if (jsonValue?.callee) {
      const value = jsonValue.value ?? jsonValue.default;
      switch (jsonValue.callee) {
        case "Tiko.useInput": {
          return key;
        }
        case "Tiko.useOutput": {
          return () => this.emitSignal(key);
        }
        case "Tiko.useEffect": {
          if (value instanceof Effect) {
            return value;
          }
          return new Effect().setProps(value);
        }
        case "Tiko.useNode": {
          if (typeof value === "string") {
            let node: Node | undefined;
            Object.defineProperty(obj, key, {
              get: () => {
                node ||= this.target.root?.getChild?.(`#${value}`);
                return node;
              },
              set: (newValue) => {
                node = newValue;
              },
            });
            return obj[key];
          }
          return value;
        }
        case "Tiko.useResNode": {
          if (jsonValue.value) {
            const node = Register.getNode(jsonValue.value.type);
            if (node) return node.setProps(jsonValue.value.props);
          }
          return undefined;
        }
        case "Tiko.useEase": {
          if (typeof value === "string") return Register.getEase(value);
          return value;
        }
        case "Tiko.useObject": {
          const obj: Record<string, any> = {};
          const entries = Object.entries(value);
          for (const [key, value] of entries) {
            obj[key] = this._getValue(obj, key, value as any);
          }
          return obj;
        }
        case "Tiko.useArray": {
          const arr: any[] = [];
          value.forEach((item: any, index: number) => {
            arr[index] = this._getValue(arr, String(index), item);
          });
          return arr;
        }
        default: {
          return value;
        }
      }
    }
    return jsonValue;
  }

  /**
   * 发射信号，执行后续图块
   * @param signal 蓝图信号
   */
  emitSignal(signal: string): void {
    if (this.enabled && this.blueprint && this.outputs) {
      const signals = this.outputs[signal];
      const blueprint = this.blueprint;
      if (signals) {
        for (const signal of signals) {
          blueprint.emit(signal.id, signal.signal, this, signal.params);
        }
      }
    }
  }

  /**
   * 当蓝图信号被触发时
   * @param signal 蓝图信号
   */
  onSignal(signal: string): void {
    // 默认初始化信号
    if (signal === "$start$") {
      this.run();
    }
  }

  /**
   * 执行脚本
   */
  run(): void {
    if (this.enabled) {
      if (this.delay === 0) this._runScript();
      else this.stage?.timer.once(this.delay, this._runScript, this);
    }
  }

  private _runScript() {
    if (this.destroyed || this.target.destroyed) return this.destroy();
    this.started = this.ended = false;
    this.awake();
    this.start();
    this.end();
  }

  override awake(): void {
    if (!this.awaked) {
      this._regEvent();
      super.awake();
    }
  }

  private _regEvent(): void {
    const prototype = ScriptBlock.prototype;
    const target = this.target;
    if (target) {
      // 鼠标事件
      if (this.onClick !== prototype.onClick) {
        target.on("click", this.onClick, this);
      }
      if (this.onMouseDown !== prototype.onMouseDown) {
        target.on("mousedown", this.onMouseDown, this);
      }
      if (this.onMouseUp !== prototype.onMouseUp) {
        target.on("mouseup", this.onMouseUp, this);
      }
      if (this.onMouseMove !== prototype.onMouseMove) {
        target.on("mousemove", this.onMouseMove, this);
      }

      // 键盘事件
      if (this.onKeyDown !== prototype.onKeyDown) {
        this.stage?.on("keydown", this.onKeyDown.bind(this));
      }
      if (this.onKeyUp !== prototype.onKeyUp) {
        this.stage?.on("keyup", this.onKeyUp.bind(this));
      }

      // 物理事件
      if (this.onCollisionStart !== prototype.onCollisionStart) {
        target.on("collisionStart", this.onCollisionStart, this);
      }
      if (this.onCollisionEnd !== prototype.onCollisionEnd) {
        target.on("collisionEnd", this.onCollisionEnd, this);
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
