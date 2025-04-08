import type { Fixture } from "planck";
import { Point, type IPoint } from "../math/point";
import { ScriptBase } from "../scripts/script-base";
import { RegScript } from "../utils/decorators";
import { getCategoryBit, getCategoryMask, inBoundaryArea, pl, to2DPos, toPhy, toPhyPos, world } from "./physics";

/** 物理类型 */
export type RigidType = "static" | "kinematic" | "dynamic";
/** 可穿透类型 */
export type CrossSide = "left" | "right" | "top" | "bottom";
export interface IShape {
  /** 形状分类 */
  shapeType: "box" | "circle" | "edge" | "polygon";
  /** 形状偏移 */
  offset?: { x: number; y: number };
  /** 形状宽度 */
  width?: number;
  /** 形状高度 */
  height?: number;
  /** 线段或者多边形点的集合 */
  points?: IPoint[];

  /** 摩擦力 0-1，默认为 0.2 */
  friction?: number;
  /** 弹性系数 0-1，默认为 0 */
  restitution?: number;
  /** 密度，默认为 1 */
  density?: number;
  /** 是否是传感器，如果是传感器，则无物理反馈，默认为 false */
  isSensor?: boolean;
  /** 过滤组索引 */
  filterGroupIndex?: number;
  /** 过滤组 */
  filterCategoryBits?: number;
  /** 过滤组 */
  filterMaskBits?: number;
  /** 穿透面，为空则不可穿透 */
  crossSide?: CrossSide;
}

export interface IRigidBodyData {
  /** 物理类型，static：静止不动类型，kinematic：运动类型（没有重力），dynamic：动态类型，支持重力，如果两个物品要想相互碰撞，则其中一个物体的类型必须是 dynamic */
  rigidType: RigidType;
  /** 重力缩放系数，默认为 1，可以增加或减少缩放系数，实现 0 重力 */
  gravityScale?: number;
  /** 线性速度，物体默认的开始速度 */
  linearVelocity?: IPoint;
  /** 线性阻尼，影响线性速度的阻尼系数 */
  linearDamping?: number;
  /** 当前物品的旋转速度 */
  angularVelocity?: number;
  /** 旋转阻尼系数 */
  angularDamping?: number;
  /** 是否是子弹，对于一些高速运动物体，设置为 true 会一定程度解决穿透问题，但会有额外的性能开销 */
  bullet?: boolean;
  /** 是否允许旋转 */
  allowRotation?: boolean;
  /** 物理分类，用来作为碰撞依据 */
  category?: string;
  /** 接受碰撞的分类列表，本物体和只和列表中物品发生碰撞，如果为空，则和所有物体发生碰撞 */
  categoryAccepted?: string[];
  /** 物理形状列表，用来描述碰撞的区域，如果为空，则默认为矩形，大小和宽高相同 */
  shapes?: IShape[];
}

/**
 * 物理刚体，实现物理属性的描述和碰撞区域的定义
 * 物理坐标系，都是以场景为根节点为基础进行计算的
 * 两个物体相撞条件：1 任意一方为 dynamic，2. maskBit & categoryBit !==0
 */
@RegScript("RigidBody")
export class RigidBody extends ScriptBase {
  private _body = world.createBody({ active: false, type: "kinematic", fixedRotation: true });

  /** 物理类型，static：静止不动类型，kinematic：运动类型（没有重力），dynamic：动态类型，支持重力，如果两个物品要想相互碰撞，则其中一个物体的类型必须是 dynamic */
  rigidType: RigidType = "static";
  /** 物理形状列表，用来描述碰撞的区域，如果为空，则默认为矩形，大小和节点的宽高相同 */
  shapes: IShape[] = [];
  /** 物理分类，用来作为碰撞依据 */
  category = "";

  private _categoryAccepted?: string[] | undefined;
  /** 接受碰撞的分类列表，本物体和只和列表中物品发生碰撞，如果为空，则和所有物体发生碰撞 */
  get categoryAccepted(): string[] | undefined {
    return this._categoryAccepted;
  }
  set categoryAccepted(value: string) {
    this._categoryAccepted = value.split(/[,，]/);
  }

  /** 当前物品的旋转速度 */
  get angularVelocity(): number {
    return this._body.getAngularVelocity();
  }
  set angularVelocity(value: number) {
    this._body.setAngularVelocity(value);
  }

  /** 旋转阻尼系数 */
  get angularDamping(): number {
    return this._body.getAngularDamping();
  }
  set angularDamping(value: number) {
    this._body.setAngularDamping(value);
  }

  /** 重力缩放系数，默认为 1，可以增加或减少缩放系数，实现 0 重力 */
  get gravityScale(): number {
    return this._body.getGravityScale();
  }
  set gravityScale(value: number) {
    this._body.setGravityScale(value);
  }

  /** 线性速度，物体默认的开始速度 */
  get linearVelocity(): IPoint {
    return this._body.getLinearVelocity();
  }
  set linearVelocity(value: IPoint) {
    this._body.setLinearVelocity(value as any);
  }

  /** 线性阻尼，影响线性速度的阻尼系数 */
  get linearDamping(): number {
    return this._body.getLinearDamping();
  }
  set linearDamping(value: number) {
    this._body.setLinearDamping(value);
  }

  /** 是否是子弹，对于一些高速运动物体，设置为 true 会一定程度解决穿透问题，但会有额外的性能开销 */
  get bullet(): boolean {
    return this._body.isBullet();
  }
  set bullet(value: boolean) {
    this._body.setBullet(value);
  }

  /** 是否允许旋转 */
  get allowRotation(): boolean {
    return !this._body.isFixedRotation();
  }
  set allowRotation(value: boolean) {
    this._body.setFixedRotation(!value);
  }

  /** 是否允许休眠 */
  get allowSleeping(): boolean {
    return this._body.isSleepingAllowed();
  }
  set allowSleeping(value: boolean) {
    this._body.setSleepingAllowed(value);
  }

  /** 是否在休眠 */
  get sleeping(): boolean {
    return !this._body.isAwake();
  }
  set sleeping(value: boolean) {
    this._body.setAwake(!value);
  }

  /** 刚体质量【只读】 */
  get mass(): number {
    return this._body.getMass();
  }

  constructor(options?: IRigidBodyData) {
    super();
    if (options) {
      this.setProps(options as Record<string, any>);
    }
  }

  onAwake(): void {
    if (!this.scene) throw new Error("Please add to a scene first");

    const body = this._body;
    if (this.rigidType === "dynamic") body.setDynamic();
    else if (this.rigidType === "static") body.setStatic();

    if (this.shapes.length) {
      for (const shape of this.shapes) {
        this.addShape(shape);
      }
    } else {
      this.addShape({ shapeType: "box" });
    }

    const p = Point.TEMP.set(0, 0);
    const point = this.target.toWorldPoint(p, p, this.scene);
    body.setPosition(toPhyPos(point));
    body.setAngle(this.target.rotation);
    body.setActive(true);
    body.setUserData(this);
  }

  onUpdate(): void {
    if (this.rigidType === "static") return;
    const target = this.target;
    const pos = this._body.getPosition();
    let pos2D = to2DPos(pos);

    // 检测是否在全局边界内，不在则销毁 target
    if (!inBoundaryArea(pos2D)) {
      this.target.destroy();
      return;
    }

    if (this.target.parent !== this.scene) {
      pos2D = this.target.parent!.toLocalPoint(pos2D, pos2D, this.scene);
    }
    target.pos.set(pos2D.x + target.pivot.x, pos2D.y + target.pivot.y);
    target.rotation = this._body.getAngle();
    // console.log(pos.x, pos.y, this.target.pos.x, this.target.pos.y);
  }
  onEnable(): void {
    this._body.setActive(true);
  }
  onDisable(): void {
    this._body.setActive(false);
  }
  onDestroy(): void {
    world.destroyBody(this._body);
  }

  /** 添加刚体形状 */
  addShape(shape: IShape): void {
    if (!this.awaked) {
      this.shapes.push(shape);
      return;
    }

    const options = {
      density: 1,
      filterGroupIndex: 0,
      filterCategoryBits: getCategoryBit(this.category),
      filterMaskBits: getCategoryMask(this.categoryAccepted),
      ...shape,
    };
    const target = this.target;
    const bounds = target.getWorldBounds(this.scene);
    const width = shape.width ?? bounds.width;
    const height = shape.height ?? bounds.height;

    let fixture: Fixture;
    const offsetX = toPhy(shape.offset?.x ?? 0 + target.pivot.x);
    const offsetY = toPhy(shape.offset?.y ?? 0 + target.pivot.y);
    switch (shape.shapeType) {
      case "box": {
        const hw = toPhy(width) / 2;
        const hh = toPhy(height) / 2;
        fixture = this._body.createFixture(new pl.Box(hw, hh, { x: hw + offsetX, y: hh + offsetY }), options);
        break;
      }
      case "circle": {
        const radius = toPhy(width);
        fixture = this._body.createFixture(new pl.Circle({ x: offsetX, y: offsetY }, radius), options);
        break;
      }
      case "edge": {
        fixture = this._body.createFixture(
          new pl.Edge({ x: offsetX, y: offsetY }, { x: offsetX + toPhy(width), y: offsetY }),
          options,
        );
        break;
      }
      case "polygon": {
        const vertices: Array<any> = [];
        const points = shape.points || [];
        for (const point of points) {
          vertices.push(toPhyPos(point));
        }
        fixture = this._body.createFixture(new pl.Polygon(vertices), options);
        break;
      }
    }
    if (fixture && options.crossSide) {
      fixture.setUserData({ crossSide: options.crossSide });
    }
  }

  /**
   * 设置刚体位置
   * @param x x轴坐标
   * @param y y轴坐标
   */
  setPosition(x: number, y: number): void {
    this._body.setPosition(toPhyPos({ x: x, y: y }));
    if (this.rigidType !== "static") this._body.setAwake(true);
  }

  /**
   * 设置刚体速度
   * @param x 如果x为空，则不改变x方向速度
   * @param y 如果x为空，则不改变y方向速度
   */
  setVelocity(x?: number, y?: number): void {
    this._body.setLinearVelocity({ x: x ?? this.linearVelocity.x, y: y ?? this.linearVelocity.y });
  }

  /**
   * 施加力，会慢慢产生速度，想通过力移动物体，需要满足两个条件，1. 物体是 dynamic 类型，2.力量足够大，能推动物体运动
   * @param force 力适量
   * @param point 作用点
   */
  applyForce(force: IPoint, point: IPoint = { x: 0, y: 0 }): void {
    this._body.applyForce(force as any, point as any, true);
  }

  /**
   * 施加力到中心点，想通过力移动物体，需要满足两个条件，1. 物体是 dynamic 类型，2.力量足够大，能推动物体运动
   * @param force 力适量
   */
  applyForceToCenter(force: IPoint): void {
    this._body.applyForceToCenter(force as any, true);
  }

  /**
   * 施加线性冲量，和当前速度进行叠加（必须是dynamic类型的物体才生效）
   * @param impulse 线性冲量
   * @param point 作用点
   */
  applyLinearImpulse(impulse: IPoint, point: IPoint = { x: 0, y: 0 }): void {
    this._body.applyLinearImpulse(impulse as any, point as any, true);
  }

  /**
   * 施加扭矩，慢慢产生角速度
   * @param torque 扭矩
   * @param point 作用点
   */
  applyTorque(torque: number): void {
    this._body.applyTorque(torque, true);
  }

  /**
   * 施加角冲量，和当前角速度叠加，想通过力移动旋转，需要满足两个条件，1. 物体是 dynamic 类型，2.力量足够大，能推动物体运动
   * @param impulse 角冲量
   */
  applyAngularImpulse(impulse: number): void {
    this._body.applyAngularImpulse(impulse, true);
  }
}
