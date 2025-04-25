import type { Body } from "planck";
import type { IPoint } from "../math/point";
import type { LikoNode } from "../nodes/node";
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
  vertices: IPoint[];
}

export interface IPolygonShape extends IBaseShape {
  shapeType: "polygon";
  vertices: IPoint[];
}

export type IShape = IBoxShape | ICircleShape | IChainShape | IPolygonShape;

/**
 * 旋转关节配置选项
 *
 * 用途：允许两个刚体围绕一个点旋转，类似于铰链或轴承。
 *
 * 应用场景：
 * - 门的铰链
 * - 摆钟的摆锤
 * - 车辆的车轮
 * - 角色的关节（如手臂、腿部）
 * - 带有马达功能时可用于驱动旋转运动
 */
export interface IRevoluteJoint {
  /** 关节类型，旋转关节 */
  jointType: "revolute";
  /** 目标刚体 */
  targetBody: IRigidBody;
  /** 当前刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorA: IPoint;
  /** 目标刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorB: IPoint;
  /** 是否允许连接的两个刚体相互碰撞，默认为false */
  collideConnected?: boolean;
  /** 是否启用角度限制 */
  enableLimit?: boolean;
  /** 最小角度限制（弧度） */
  lowerAngle?: number;
  /** 最大角度限制（弧度） */
  upperAngle?: number;
  /** 是否启用马达 */
  enableMotor?: boolean;
  /** 马达最大扭矩 */
  maxMotorTorque?: number;
  /** 马达速度（弧度/秒） */
  motorSpeed?: number;
}

/**
 * 距离关节配置选项
 *
 * 用途：保持两个物体之间的距离在指定范围内，可以是刚性的或有弹性的。
 *
 * 应用场景：
 * - 绳索或链条连接
 * - 弹簧系统
 * - 吊桥的悬挂结构
 * - 弹性连接的物体
 * - 通过调整频率和阻尼比可以模拟不同材质的连接
 */
export interface IDistanceJoint {
  /** 关节类型，距离关节 */
  jointType: "distance";
  /** 目标刚体 */
  targetBody: IRigidBody;
  /** 当前刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorA: IPoint;
  /** 目标刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorB: IPoint;
  /** 是否允许连接的两个刚体相互碰撞，默认为false */
  collideConnected?: boolean;
  /** 两个锚点之间的距离，默认为当前两点间的距离 */
  length?: number;
  /** 频率，用于软约束，默认为0（硬约束） */
  frequency?: number;
  /** 阻尼比，用于软约束，默认为0 */
  dampingRatio?: number;
}

/**
 * 固定关节配置选项
 *
 * 用途：将两个刚体固定在一起，使它们保持相对位置不变。
 *
 * 应用场景：
 * - 创建复合物体，如将车轮固定到车身
 * - 构建不需要活动部件的静态结构
 * - 模拟焊接或粘合的物体
 */
export interface IFixedJoint {
  /** 关节类型，固定关节 */
  jointType: "fixed";
  /** 目标刚体 */
  targetBody: IRigidBody;
  /** 当前刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorA: IPoint;
  /** 目标刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorB: IPoint;
  /** 是否允许连接的两个刚体相互碰撞，默认为false */
  collideConnected?: boolean;
  /** 频率，用于软约束，默认为0（硬约束） */
  frequency?: number;
  /** 阻尼比，用于软约束，默认为0 */
  dampingRatio?: number;
}

/**
 * 棱柱关节配置选项
 *
 * 用途：允许两个物体沿着指定轴线相对移动，限制其他方向的移动和旋转。
 *
 * 应用场景：
 * - 滑动门或抽屉
 * - 液压活塞
 * - 电梯或升降平台
 * - 线性运动的机械部件
 * - 带有马达功能时可用于驱动直线运动
 */
export interface IPrismaticJoint {
  /** 关节类型，棱柱关节 */
  jointType: "prismatic";
  /** 目标刚体 */
  targetBody: IRigidBody;
  /** 当前刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorA: IPoint;
  /** 目标刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorB: IPoint;
  /** 局部轴向，定义允许移动的方向 */
  localAxisA: IPoint;
  /** 是否允许连接的两个刚体相互碰撞，默认为false */
  collideConnected?: boolean;
  /** 参考角度，默认为0 */
  referenceAngle?: number;
  /** 是否启用移动限制 */
  enableLimit?: boolean;
  /** 最小移动限制 */
  lowerTranslation?: number;
  /** 最大移动限制 */
  upperTranslation?: number;
  /** 是否启用马达 */
  enableMotor?: boolean;
  /** 马达最大力 */
  maxMotorForce?: number;
  /** 马达速度 */
  motorSpeed?: number;
}

/**
 * 轮子关节配置选项
 *
 * 用途：专门为车轮设计的关节，结合了旋转和悬挂功能，允许沿着指定轴线移动并绕着锚点旋转。
 *
 *  应用场景：
 * - 车辆的车轮和悬挂系统
 * - 带有减震功能的移动平台
 * - 自行车或摩托车的模拟
 * - 任何需要平滑滚动和悬挂效果的物体
 * - 通过频率和阻尼比可以调整悬挂的软硬度
 */
export interface IWheelJoint {
  /** 关节类型，轮子关节 */
  jointType: "wheel";
  /** 目标刚体 */
  targetBody: IRigidBody;
  /** 当前刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorA: IPoint;
  /** 目标刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorB: IPoint;
  /** 局部轴向，定义允许移动的方向 */
  localAxisA: IPoint;
  /** 是否允许连接的两个刚体相互碰撞，默认为false */
  collideConnected?: boolean;
  /** 是否启用马达 */
  enableMotor?: boolean;
  /** 马达最大扭矩 */
  maxMotorTorque?: number;
  /** 马达速度（弧度/秒） */
  motorSpeed?: number;
  /** 频率，用于软约束，默认为2.0 */
  frequency?: number;
  /** 阻尼比，用于软约束，默认为0.7 */
  dampingRatio?: number;
}

/**
 * 绳索关节配置选项
 *
 * 用途：限制两个物体之间的最大距离，但不限制最小距离，类似于不可伸长的绳索。
 *
 * 应用场景：
 * - 悬挂物体的绳索
 * - 牵引或拖拽系统
 * - 链条约束
 * - 任何需要限制最大距离但允许物体自由移动的情况
 * - 与距离关节不同，绳索关节只在达到最大长度时产生约束力
 */
export interface IRopeJoint {
  /** 关节类型，绳索关节 */
  jointType: "rope";
  /** 目标刚体 */
  targetBody: IRigidBody;
  /** 当前刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorA: IPoint;
  /** 目标刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorB: IPoint;
  /** 绳索的最大长度 */
  maxLength: number;
  /** 是否允许连接的两个刚体相互碰撞，默认为false */
  collideConnected?: boolean;
}

/**
 * 马达关节配置选项
 *
 * 用途：控制两个物体之间的相对线性和角速度，不限制位置或角度。
 *
 * 应用场景：
 * - 需要精确控制物体运动速度的场景
 * - 模拟电机驱动的机械装置
 * - 需要平滑过渡的运动控制
 * - 物体跟随系统
 * - 与其他关节不同，马达关节不约束位置，只控制速度
 */
export interface IMotorJoint {
  /** 关节类型，马达关节 */
  jointType: "motor";
  /** 目标刚体 */
  targetBody: IRigidBody;
  /** 是否允许连接的两个刚体相互碰撞，默认为true */
  collideConnected?: boolean;
  /** 线性偏移，相对位置的目标值 */
  linearOffset?: IPoint;
  /** 角度偏移，相对角度的目标值 */
  angularOffset?: number;
  /** 最大力，用于限制马达施加的力 */
  maxForce?: number;
  /** 最大扭矩，用于限制马达施加的扭矩 */
  maxTorque?: number;
  /** 校正因子，范围0-1，控制位置校正的速度，默认为0.3 */
  correctionFactor?: number;
}

/**
 * 滑轮关节配置选项
 *
 * 用途：创建一个虚拟的滑轮系统，连接两个物体，使它们的移动距离保持特定比例关系。
 *
 * 应用场景：
 * - 电梯和配重系统
 * - 滑轮传动装置
 * - 吊车或起重机
 * - 复杂的机械传动系统
 * - 通过比率参数可以模拟不同大小滑轮的力学效果
 */
export interface IPulleyJoint {
  /** 关节类型，滑轮关节 */
  jointType: "pulley";
  /** 目标刚体 */
  targetBody: IRigidBody;
  /** 当前刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorA: IPoint;
  /** 目标刚体上的连接点，相对于刚体中心的偏移 */
  localAnchorB: IPoint;
  /** 当前刚体的滑轮固定点，相对于世界坐标 */
  groundAnchorA: IPoint;
  /** 目标刚体的滑轮固定点，相对于世界坐标 */
  groundAnchorB: IPoint;
  /** 连接到物体A的绳索段参考长度，定义滑轮系统中第一条绳索的静止长度 */
  lengthA: number;
  /** 连接到物体B的绳索段参考长度，定义滑轮系统中第二条绳索的静止长度 */
  lengthB: number;
  /** 滑轮比率，定义两个物体移动距离的比例关系 */
  ratio: number;
  /** 是否允许连接的两个刚体相互碰撞，默认为true */
  collideConnected?: boolean;
}

export type IJoint =
  | IRevoluteJoint
  | IDistanceJoint
  | IFixedJoint
  | IPrismaticJoint
  | IWheelJoint
  | IRopeJoint
  | IMotorJoint
  | IPulleyJoint;

export type IRigidBody = {
  target: LikoNode;
  body: Body;
};
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
  /**
   * 关节列表，用于定义该刚体与其他刚体的连接关系
   *
   * 用途：关节系统用于连接两个刚体，限制它们的相对运动，模拟各种机械连接和约束。
   *
   * 关节系统的主要特点：
   * - 提供多种类型的关节满足不同物理模拟需求
   * - 可以创建复杂的机械结构和物理交互
   * - 支持软约束和硬约束（通过频率和阻尼比参数调节）
   * - 部分关节支持马达功能，可以主动驱动物体运动
   * - 可以组合多种关节创建高级机械系统
   *
   * 关节类型概览：
   * - 旋转关节(Revolute)：允许围绕一点旋转，适用于门铰链、摆钟等
   * - 距离关节(Distance)：保持两物体间距离，可用于绳索、弹簧等
   * - 固定关节(Fixed)：将两物体固定在一起，用于创建复合结构
   * - 棱柱关节(Prismatic)：允许沿轴线移动，适用于滑动门、活塞等
   * - 轮子关节(Wheel)：专为车轮设计，结合旋转和悬挂功能
   * - 绳索关节(Rope)：限制最大距离但不限制最小距离，适用于拖拽系统
   * - 马达关节(Motor)：控制相对速度，不限制位置，用于精确速度控制
   * - 滑轮关节(Pulley)：创建虚拟滑轮系统，用于电梯、起重机等
   */
  joints?: IJoint[];

  /** 碰撞开始回调 */
  onCollisionStart?: (e: ICollision) => void;
  /** 碰撞结束回调 */
  onCollisionEnd?: (e: ICollision) => void;
}
