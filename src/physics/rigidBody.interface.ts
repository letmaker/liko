import type { IPoint } from "../math/point";

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

/** RigidBody 接口定义 */

export interface IRigidBody {
  rigidType: RigidType;
  shapes: IShape[];
  category: string;
  isSensor: boolean;
  categoryAccepted: string[] | undefined;
  angularVelocity: number;
  angularDamping: number;
  gravityScale: number;
  linearVelocity: IPoint;
  linearDamping: number;
  bullet: boolean;
  allowRotation: boolean;
  allowSleeping: boolean;
  sleeping: boolean;
  readonly mass: number;

  addShape(shape: IShape): void;
  setPosition(x: number, y: number): void;
  setVelocity(x?: number, y?: number): void;
  applyForce(force: IPoint, point?: IPoint): void;
  applyForceToCenter(force: IPoint): void;
  applyLinearImpulse(impulse: IPoint, point?: IPoint): void;
  applyTorque(torque: number): void;
  applyAngularImpulse(impulse: number): void;
}
