import * as planck from "planck";
import { type IPoint, type Rectangle, Timer } from "../";
import type { RigidBody } from "./rigidBody";

interface FixtureUserData {
  /** 允许穿透的边界方向 */
  crossSide?: "left" | "right" | "top" | "bottom" | "none";
}

/**
 * 物理引擎配置选项
 */
export interface PhysicsOptions {
  /** 是否启用物理引擎 */
  enabled?: boolean;
  /** 使用的计时器实例 */
  timer?: Timer;
  /** 重力向量 */
  gravity?: { x: number; y: number };
  /** 是否允许物体休眠 */
  allowSleeping?: boolean;
  /** 物理世界边界区域，碰到边界会自动销毁，提升性能 */
  boundaryArea?: Rectangle;
  /** 是否启用调试模式 */
  debug?: boolean;
}

/**
 * 物理引擎类
 * 2D 物理引擎封装，提供了坐标转换、碰撞检测、物理模拟等功能
 */
export class Physics {
  private _categoryBitCount = 1;
  private _categoryMap: { [category: string]: number } = {};
  private _contacts: (number | planck.Contact)[] = [];
  private _enabled = false;
  private _timer = Timer.system;
  private _pixelRatio = 50;

  /** Planck 物理引擎实例 */
  pl = planck;
  /** 物理世界实例 */
  world = new planck.World({ gravity: { x: 0, y: 20 } });
  /** 物理世界边界区域，超出此区域的刚体会被销毁 */
  boundaryArea?: Rectangle = undefined;

  constructor() {
    this._setupCollision();
  }

  private _setupCollision(): void {
    const world = this.world;

    // 处理碰撞穿透
    world.on("pre-solve", (contact: planck.Contact) => {
      const data = contact.getFixtureA().getUserData() as FixtureUserData;
      if (data?.crossSide) {
        const normal = contact.getManifold().localNormal;
        switch (data.crossSide) {
          case "left":
            if (normal.x < -0.5) contact.setEnabled(false);
            break;
          case "right":
            if (normal.x > 0.5) contact.setEnabled(false);
            break;
          case "top":
            if (normal.y < -0.5) contact.setEnabled(false);
            break;
          case "bottom":
            if (normal.y > 0.5) contact.setEnabled(false);
            break;
        }
      }
    });

    // 处理碰撞
    world.on("begin-contact", (contact) => this._onContact(0, contact));
    world.on("end-contact", (contact) => this._onContact(1, contact));
  }

  private _onContact(type: number, contact: planck.Contact): void {
    this._contacts.push(type, contact);
  }

  /**
   * 初始化物理引擎
   * @param options - 物理引擎配置选项
   * @returns 当前物理引擎实例，支持链式调用
   */
  init(options?: PhysicsOptions) {
    if (options) {
      if (options.timer) {
        this._timer = options.timer;
      }
      if (options.gravity) {
        this.setGravity(options.gravity.x, options.gravity.y);
      }
      if (options.allowSleeping) {
        this.allowSleeping(options.allowSleeping);
      }
      if (options.boundaryArea) {
        this.setBoundaryArea(options.boundaryArea);
      }
      if (options.enabled) {
        this.enable(true);
      }
      if (options.debug) {
        this.debug();
      }
    }

    return this;
  }

  /**
   * 转换游戏坐标到物理世界坐标
   * @param value - 游戏世界中的坐标值
   * @returns 物理世界中的坐标值
   */
  toPh = (value: number) => {
    return value / this._pixelRatio;
  };

  /**
   * 转换物理坐标到游戏坐标
   * @param value - 物理世界中的坐标值
   * @returns 游戏世界中的坐标值
   */
  to2D = (value: number) => {
    return value * this._pixelRatio;
  };

  /**
   * 转换游戏坐标点到物理世界坐标点
   * @param pos - 游戏世界中的坐标点
   * @param out - 输出结果的对象，默认为新对象
   * @returns 物理世界中的坐标点
   */
  toPhPos = (pos: IPoint, out: IPoint = { x: 0, y: 0 }) => {
    out.x = pos.x / this._pixelRatio;
    out.y = pos.y / this._pixelRatio;
    return out;
  };

  /**
   * 转换物理坐标点到游戏坐标点
   * @param pos - 物理世界中的坐标点
   * @param out - 输出结果的对象，默认为新对象
   * @returns 游戏世界中的坐标点
   */
  to2DPos = (pos: IPoint, out: IPoint = { x: 0, y: 0 }) => {
    out.x = pos.x * this._pixelRatio;
    out.y = pos.y * this._pixelRatio;
    return out;
  };

  /**
   * 设置重力
   * @param x - 水平方向重力，默认为 0
   * @param y - 垂直方向重力，默认为 20
   * @returns 当前物理引擎实例，支持链式调用
   */
  setGravity(x = 0, y = 20) {
    this.world.setGravity({ x, y });
    return this;
  }

  /**
   * 设置是否允许物体休眠
   * @param value - 是否允许休眠
   * @returns 当前物理引擎实例，支持链式调用
   */
  allowSleeping(value: boolean) {
    this.world.setAllowSleeping(value);
    return this;
  }

  /**
   * 清理世界内的所有施加的力
   * @returns 当前物理引擎实例，支持链式调用
   */
  clearForces() {
    this.world.clearForces();
    return this;
  }

  /**
   * 移动世界的原点
   * @param x - 新原点的 X 坐标，默认为 0
   * @param y - 新原点的 Y 坐标，默认为 10
   * @returns 当前物理引擎实例，支持链式调用
   */
  shiftOrigin(x = 0, y = 10) {
    this.world.shiftOrigin({ x, y });
    return this;
  }

  /**
   * 启用或禁用物理引擎
   * @param value - 是否启用，默认为 true
   * @returns 当前物理引擎实例，支持链式调用
   */
  enable(value = true) {
    if (this._enabled !== value) {
      this._enabled = value;
      if (value) this._timer?.onFrame(this.update, this);
      else this._timer?.clearTimer(this.update, this);
    }
    return this;
  }

  /**
   * 设置全局边界，超过边界的刚体会被销毁
   * @param area - 边界区域，默认为 undefined（不限制）
   * @returns 当前物理引擎实例，支持链式调用
   */
  setBoundaryArea(area?: Rectangle) {
    this.boundaryArea = area;
    return this;
  }

  /**
   * 检测点是否在全局边界内
   * @param pos - 要检测的点
   * @returns 是否在边界内
   */
  inBoundaryArea(pos: IPoint): boolean {
    if (!this.boundaryArea) return true;
    return this.boundaryArea.contains(pos.x, pos.y);
  }

  /**
   * 根据分类字符串获取分类的位掩码
   * @param category - 分类名称
   * @returns 对应的位掩码值
   */
  getCategoryBit(category?: string): number {
    if (!category) return 1;
    if (!this._categoryMap[category]) {
      if (this._categoryBitCount >= 31) {
        console.error("物理引擎分类已达到最大数量(30)，无法创建新分类");
        return 1; // 返回默认值
      }
      this._categoryMap[category] = 2 ** this._categoryBitCount;
      this._categoryBitCount++;
    }
    return this._categoryMap[category];
  }

  /**
   * 根据碰撞列表，返回碰撞掩码
   * @param masks - 碰撞分类名称列表
   * @returns 组合后的碰撞掩码
   */
  getCategoryMask(masks?: string[]): number {
    if (!masks || masks.length === 0) return 65535;
    let num = 0;
    for (const name of masks) {
      num |= this.getCategoryBit(name);
    }
    return num;
  }

  /**
   * 物理世界更新
   * 处理物理模拟和碰撞事件，由计时器自动调用
   */
  update(): void {
    this.world.step(Timer.system.delta);
    this._processContacts();
  }

  private _processContacts(): void {
    const { _contacts: contacts } = this;

    // 处理所有碰撞事件
    for (let i = 0; i < contacts.length; i += 2) {
      const type = contacts[i] ? "collisionEnd" : "collisionStart";
      const contact = contacts[i + 1] as planck.Contact;

      const rigidBodyA = contact.getFixtureA()?.getBody().getUserData() as RigidBody;
      const rigidBodyB = contact.getFixtureB()?.getBody().getUserData() as RigidBody;
      // console.log(type, rigidBodyA.name, rigidBodyB.name, contacts, contact.getManifold());

      if (!rigidBodyA?.destroyed && rigidBodyA?.target.hasListener(type)) {
        rigidBodyA.target.emit(type, {
          other: rigidBodyB,
          contact: { normal: contact.getManifold().localNormal },
        });
      }

      if (!rigidBodyB?.destroyed && rigidBodyB?.target.hasListener(type)) {
        rigidBodyB.target.emit(type, {
          other: rigidBodyA,
          contact: { normal: contact.getManifold().localNormal },
        });
      }
    }
    // TODO 这个地方会有性能问题，待优化
    contacts.length = 0;
  }

  /**
   * 启动物理调试可视化
   * 加载测试台并显示物理世界
   * @returns 当前物理引擎实例，支持链式调用
   */
  debug() {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/planck/dist/planck-with-testbed.min.js";
    script.onload = () => {
      const Testbed = (window as any).planck.Testbed;
      const testbed = Testbed.mount();
      testbed.start(this.world);

      const canvas = testbed.canvas;
      canvas.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      canvas.style.transform = "scaleY(-1)";
      canvas.style.pointerEvents = "none";
    };
    document.body.appendChild(script);
    return this;
  }
}

/** 全局物理引擎实例 */
export const physics = new Physics();
