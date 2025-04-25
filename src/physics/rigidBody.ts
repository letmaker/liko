import type { Body, Joint } from "planck";
import { EventType, PI2 } from "../const";
import { type IPoint, Point } from "../math/point";
import type { ICollision } from "../scripts/script";
import { ScriptBase } from "../scripts/script-base";
import { RegScript } from "../utils/decorators";
import { addJoint } from "./joint";
import type { IJoint, IShape, RigidBodyOptions, RigidType } from "./rigidBody.interface";
import { addShape } from "./shape";

/**
 * 物理刚体组件，实现物理属性描述和碰撞区域定义
 * 物理坐标系以场景根节点为基础进行计算。两个物体相撞条件：
 * 1. 任意一方为dynamic类型
 * 2. maskBit & categoryBit !== 0
 * 注意：RigidBody为一个脚本，挂在的节点后，需要在场景中才能被激活
 */
@RegScript("RigidBody")
export class RigidBody extends ScriptBase {
  private _tempPos2D: IPoint = { x: 0, y: 0 };
  private _joints: Joint[] = [];

  /** @private */
  physics = window.physics;
  /** @private */
  body: Body;

  /** 物理类型，static(静态)、kinematic(运动学)或dynamic(动态)，至少一个物体为dynamic才能产生碰撞 */
  rigidType: RigidType = "static";
  /** 物理形状列表，描述碰撞区域，为空则默认使用与节点同大小的矩形 */
  shapes: IShape[] = [];
  /** 关节列表，描述刚体之间的连接关系 */
  joints: IJoint[] = [];
  /** 物理分类，用于碰撞检测 */
  category = "";
  /** 是否为传感器，传感器只检测碰撞但不产生物理反馈 */
  isSensor = false;
  /** 摩擦系数，范围0-1，默认为0.2 */
  friction = 0.2;
  /** 弹性系数，范围0-1，默认为0 */
  restitution = 0;

  /** 碰撞开始回调 */
  onCollisionStart?: (e: ICollision) => void;
  /** 碰撞结束回调 */
  onCollisionEnd?: (e: ICollision) => void;

  private _categoryAccepted?: string[] | undefined;
  /** 接受碰撞的分类列表，为空则与所有物体碰撞 */
  get categoryAccepted(): string[] | undefined {
    return this._categoryAccepted;
  }
  set categoryAccepted(value: string | string[] | undefined) {
    if (typeof value === "string") {
      this._categoryAccepted = value.split(/[,，]/);
    } else {
      this._categoryAccepted = value;
    }
  }

  /** 角速度，物体旋转速度，单位为弧度/秒 */
  get angularVelocity(): number {
    return this.body.getAngularVelocity();
  }
  set angularVelocity(value: number) {
    this.body.setAngularVelocity(value);
  }

  /** 角阻尼系数，影响物体旋转的减速率，值越大减速越快 */
  get angularDamping(): number {
    return this.body.getAngularDamping();
  }
  set angularDamping(value: number) {
    this.body.setAngularDamping(value);
  }

  /** 重力缩放系数，默认为1，可设为负值使物体上浮 */
  get gravityScale(): number {
    return this.body.getGravityScale();
  }
  set gravityScale(value: number) {
    this.body.setGravityScale(value);
  }

  /** 线性速度，物体当前运动速度向量 */
  get linearVelocity(): IPoint {
    return this.body.getLinearVelocity();
  }
  set linearVelocity(value: IPoint) {
    this.body.setLinearVelocity(value);
  }

  /** 线性阻尼系数，影响物体线性运动的减速率，值越大减速越快 */
  get linearDamping(): number {
    return this.body.getLinearDamping();
  }
  set linearDamping(value: number) {
    this.body.setLinearDamping(value);
  }

  /** 是否为子弹，高速物体设为true可减少穿透问题，但会增加性能开销 */
  get bullet(): boolean {
    return this.body.isBullet();
  }
  set bullet(value: boolean) {
    this.body.setBullet(value);
  }

  /** 是否允许旋转，设为false则物体保持固定方向 */
  get allowRotation(): boolean {
    return !this.body.isFixedRotation();
  }
  set allowRotation(value: boolean) {
    this.body.setFixedRotation(!value);
  }

  /** 是否允许休眠，休眠状态下物体不参与物理计算以提高性能 */
  get allowSleeping(): boolean {
    return this.body.isSleepingAllowed();
  }
  set allowSleeping(value: boolean) {
    this.body.setSleepingAllowed(value);
  }

  /** 是否处于休眠状态，休眠时物体暂停物理计算 */
  get sleeping(): boolean {
    return !this.body.isAwake();
  }
  set sleeping(value: boolean) {
    this.body.setAwake(!value);
  }

  /** 刚体质量，由形状和密度决定（只读） */
  get mass(): number {
    return this.body.getMass();
  }

  constructor(options?: RigidBodyOptions) {
    super();
    console.assert(this.physics !== undefined, "physics not init");
    this.body = this.physics.world.createBody({ active: false, type: "kinematic", fixedRotation: true });
    if (options) {
      this.setProps(options as Record<string, any>);
    }
  }

  /**
   * 组件唤醒时初始化物理刚体
   * 设置刚体类型、添加形状、设置初始位置和角度
   */
  override onAwake(): void {
    const body = this.body;
    const target = this.target;

    if (this.rigidType === "dynamic") body.setDynamic();
    else if (this.rigidType === "static") body.setStatic();

    if (this.shapes.length) {
      for (const shape of this.shapes) {
        addShape(this, shape);
      }
    } else {
      addShape(this, { shapeType: "box" });
    }

    const tempPoint = Point.TEMP.set(0, 0);
    const worldPoint = target.localToWorld(tempPoint, tempPoint, this.scene);
    body.setPosition(this.physics.toPhPos(worldPoint));
    body.setAngle(target.rotation);
    body.setActive(true);
    body.setUserData(this);

    if (this.onCollisionStart || this.onCollisionEnd) {
      this._registerCollisionEvent();
    }

    if (this.joints.length) {
      for (const joint of this.joints) {
        const j = addJoint(this, joint);
        j?.setUserData(joint.label);
        if (j) this._joints.push(j);
      }
    }
  }

  private _registerCollisionEvent() {
    if (this.onCollisionStart) {
      this.target.on(EventType.collisionStart, this.onCollisionStart, this);
    }
    if (this.onCollisionEnd) {
      this.target.on(EventType.collisionEnd, this.onCollisionEnd, this);
    }
  }

  /**
   * 每帧更新物体位置和旋转
   * 同步物理引擎计算结果到游戏对象，并检测边界
   */
  override onUpdate(): void {
    if (this.rigidType === "static") return;
    const target = this.target;
    const pos = this.body.getPosition();

    // 复用临时对象
    let pos2D = this.physics.to2DPos(pos, this._tempPos2D);

    // 检测是否在全局边界内，不在则销毁 target
    if (!this.physics.inBoundaryArea(pos2D)) {
      this.target.destroy();
      return;
    }

    if (this.target.parent !== this.scene) {
      pos2D = this.target.parent!.worldToLocal(pos2D, pos2D, this.scene);
    }

    if (this.allowRotation) {
      const angle = this.body.getAngle();
      target.rotation = angle % PI2;
    }

    const pivotX = target.pivot.x * target.scale.x;
    const pivotY = target.pivot.y * target.scale.y;
    if (target.rotation === 0) {
      target.pos.set(pos2D.x + pivotX, pos2D.y + pivotY);
      return;
    }

    // 考虑旋转角度对 pivot 偏移的影响
    const cos = Math.cos(target.rotation);
    const sin = Math.sin(target.rotation);
    target.pos.set(pos2D.x + (pivotX * cos - pivotY * sin), pos2D.y + (pivotX * sin + pivotY * cos));
  }

  /**
   * 组件启用时激活物理刚体
   */
  override onEnable(): void {
    this.body.setActive(true);
  }

  /**
   * 组件禁用时停用物理刚体
   */
  override onDisable(): void {
    this.body.setActive(false);
  }

  /**
   * 设置刚体位置
   * 注意：如果物体使用了刚体，直接修改node.pos是无效的，需要使用此方法
   * @param x - x轴坐标
   * @param y - y轴坐标
   */
  setPosition(x: number, y: number): void {
    let worldPos = { x, y };
    // 如果父节不是场景，需要转换到场景坐标
    if (this.target.parent !== this.scene) {
      worldPos = this.target.parent!.localToWorld(worldPos, worldPos, this.scene);
    }

    this.body.setPosition(this.physics.toPhPos(worldPos));
    if (this.rigidType !== "static") this.body.setAwake(true);
  }

  /**
   * 获取刚体当前位置
   * @returns 刚体位置坐标
   */
  getPosition(): IPoint {
    const pos = this.body.getPosition();
    return this.physics.to2DPos(pos);
  }

  /**
   * 获取刚体当前旋转角度
   * @returns 旋转角度（弧度）
   */
  getRotation(): number {
    return this.body.getAngle() % PI2;
  }

  /**
   * 设置刚体旋转角度
   * @param rotation - 旋转角度（弧度）
   */
  setRotation(rotation: number): void {
    this.body.setAngle(rotation);
    this.target.rotation = rotation;
    if (this.rigidType !== "static") this.body.setAwake(true);
  }

  /**
   * 设置刚体线性速度
   * @param x - x方向速度，为undefined则保持当前速度
   * @param y - y方向速度，为undefined则保持当前速度
   */
  setLinearVelocity(x?: number, y?: number): void {
    this.body.setLinearVelocity({ x: x ?? this.linearVelocity.x, y: y ?? this.linearVelocity.y });
  }

  /**
   * 施加线性冲量，立即改变物体速度
   * 仅对dynamic类型物体有效，效果比施加力更直接
   * @param impulse - 冲量向量
   * @param point - 作用点，默认为物体原点
   */
  applyLinearImpulse(impulse: IPoint, point: IPoint = { x: 0, y: 0 }): void {
    console.assert(this.rigidType === "dynamic", "applyLinearImpulse only works on dynamic bodies");
    this.body.applyLinearImpulse(impulse, point, true);
  }

  /**
   * 施加力，会逐渐产生速度变化
   * 仅对dynamic类型物体有效，力量需足够大才能克服摩擦和重力
   * @param force - 力向量，包含 x 和 y 分量
   * @param point - 作用点，默认为物体原点，相对于物体中心的偏移
   */
  applyForce(force: IPoint, point: IPoint = { x: 0, y: 0 }): void {
    console.assert(this.rigidType === "dynamic", "applyForce only works on dynamic bodies");
    this.body.applyForce(force, point, true);
  }

  /**
   * 在物体中心点施加力，会逐渐改变物体速度
   * 仅对dynamic类型物体有效，力量需足够大才能克服摩擦和重力
   * @param force - 力向量
   */
  applyForceToCenter(force: IPoint): void {
    console.assert(this.rigidType === "dynamic", "applyForceToCenter only works on dynamic bodies");
    this.body.applyForceToCenter(force, true);
  }

  /**
   * 施加扭矩，会逐渐产生角速度变化
   * 仅对dynamic类型且allowRotation为true的物体有效
   * @param torque - 扭矩值
   */
  applyTorque(torque: number): void {
    console.assert(
      this.rigidType === "dynamic" && this.allowRotation,
      "applyTorque only works on dynamic bodies with allowRotation enabled",
    );
    this.body.applyTorque(torque, true);
  }

  /**
   * 施加角冲量，立即改变物体角速度
   * 仅对dynamic类型且allowRotation为true的物体有效
   * @param impulse - 角冲量值
   */
  applyAngularImpulse(impulse: number): void {
    console.assert(
      this.rigidType === "dynamic" && this.allowRotation,
      "applyAngularImpulse only works on dynamic bodies with allowRotation enabled",
    );
    this.body.applyAngularImpulse(impulse, true);
  }

  destroyJoint(label: string): void {
    const joint = this._joints.find((j) => j.getUserData() === label);
    if (joint) {
      this.physics.world.destroyJoint(joint);
      this._joints = this._joints.filter((j) => j !== joint);
    }
  }

  /**
   * 组件销毁时清理物理刚体和关联的关节
   */
  override onDestroy(): void {
    // TODO 会不会自动销毁关节和形状
    for (const joint of this._joints) {
      this.physics.world.destroyJoint(joint);
    }
    this.physics.world.destroyBody(this.body);
  }
}
