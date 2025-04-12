import type { IPoint } from "../math/point";
import type { ICollision } from "../scripts/script";

/** 物理刚体类型：静态、运动学或动态 */
export type RigidType = "static" | "kinematic" | "dynamic";
/** 可穿透的边界方向 */
export type CrossSide = "left" | "right" | "top" | "bottom";

/**
 * 物理形状接口，定义刚体的碰撞区域
 */
export interface IBaseShape {
  /** 形状相对于物体中心的偏移量 */
  offset?: { x: number; y: number };
  /** 摩擦系数，范围0-1，默认为0.2 */
  friction?: number;
  /** 弹性系数，范围0-1，默认为0 */
  restitution?: number;
  /** 密度，影响物体质量，默认为1 */
  density?: number;
  /** 是否为传感器，传感器只检测碰撞但不产生物理反馈，默认为false */
  isSensor?: boolean;
  /** 碰撞过滤组索引，同组物体可设置为不相互碰撞 */
  filterGroupIndex?: number;
  /** 碰撞过滤类别位，定义物体所属的碰撞类别 */
  filterCategoryBits?: number;
  /** 碰撞过滤掩码位，定义物体可与哪些类别碰撞 */
  filterMaskBits?: number;
  /** 可穿透的边界方向，为空则不可穿透 */
  crossSide?: CrossSide;
}

export interface IBoxShape extends IBaseShape {
  shapeType: "box";
  width?: number;
  height?: number;
}

export interface ICircleShape extends IBaseShape {
  shapeType: "circle";
  radius?: number;
}

export interface IChainShape extends IBaseShape {
  shapeType: "chain";
  points: IPoint[];
}

export interface IPolygonShape extends IBaseShape {
  shapeType: "polygon";
  points: IPoint[];
}

export type IShape = IBoxShape | ICircleShape | IChainShape | IPolygonShape;

/**
 * 刚体配置选项，用于初始化物理刚体
 */
export interface RigidBodyOptions {
  /** 物理类型，static(静态)、kinematic(运动学)或dynamic(动态)，如果两个物品要想相互碰撞，则其中一个物体的类型必须是 dynamic */
  rigidType: RigidType;
  /** 重力缩放系数，默认为1，可调整以改变重力影响 */
  gravityScale?: number;
  /** 线性速度，物体初始运动速度 */
  linearVelocity?: IPoint;
  /** 线性阻尼系数，影响物体线性运动的减速率 */
  linearDamping?: number;
  /** 角速度，物体初始旋转速度，单位为弧度/秒 */
  angularVelocity?: number;
  /** 角阻尼系数，影响物体旋转的减速率 */
  angularDamping?: number;
  /** 是否为子弹，高速物体设为true可减少穿透问题，但会增加性能开销 */
  bullet?: boolean;
  /** 是否允许旋转，默认为false */
  allowRotation?: boolean;
  /** 物理分类，用于碰撞检测 */
  category?: string;
  /** 接受碰撞的分类列表，为空则与所有物体碰撞 */
  categoryAccepted?: string[];
  /** 物理形状列表，为空则默认使用与节点同大小的矩形 */
  shapes?: IShape[];
  /** 刚体标识符，可用于查找特定刚体 */
  id?: string;
  /** 刚体标签 */
  label?: string;
  /** 是否为传感器，传感器只检测碰撞但不产生物理反馈 */
  isSensor?: boolean;
  /** 摩擦系数，范围0-1，默认为0.2 */
  friction?: number;
  /** 弹性系数，范围0-1，默认为0 */
  restitution?: number;

  /** 碰撞开始回调 */
  onCollisionStart?: (e: ICollision) => void;
  /** 碰撞结束回调 */
  onCollisionEnd?: (e: ICollision) => void;
}
