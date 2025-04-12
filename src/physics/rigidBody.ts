import type { Fixture, Body } from "planck";
import { type IPoint, ScriptBase, Point, RegScript, PI2 } from "../";
import type { RigidType, IShape, RigidBodyOptions } from "./rigidBody.interface";

/**
 * 物理刚体组件，实现物理属性描述和碰撞区域定义
 * 物理坐标系以场景根节点为基础进行计算。两个物体相撞条件：
 * 1. 任意一方为dynamic类型
 * 2. maskBit & categoryBit !== 0
 */
@RegScript("RigidBody")
export class RigidBody extends ScriptBase {
  private _physics = window.physics;
  private _body: Body;
  private _tempPos2D: IPoint = { x: 0, y: 0 };

  /** 物理类型，static(静态)、kinematic(运动学)或dynamic(动态)，至少一个物体为dynamic才能产生碰撞 */
  rigidType: RigidType = "static";
  /** 物理形状列表，描述碰撞区域，为空则默认使用与节点同大小的矩形 */
  shapes: IShape[] = [];
  /** 物理分类，用于碰撞检测 */
  category = "";
  /** 是否为传感器，传感器只检测碰撞但不产生物理反馈 */
  isSensor = false;
  /** 摩擦系数，范围0-1，默认为0.2 */
  friction = 0.2;
  /** 弹性系数，范围0-1，默认为0 */
  restitution = 0;

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
    return this._body.getAngularVelocity();
  }
  set angularVelocity(value: number) {
    this._body.setAngularVelocity(value);
  }

  /** 角阻尼系数，影响物体旋转的减速率，值越大减速越快 */
  get angularDamping(): number {
    return this._body.getAngularDamping();
  }
  set angularDamping(value: number) {
    this._body.setAngularDamping(value);
  }

  /** 重力缩放系数，默认为1，可设为负值使物体上浮 */
  get gravityScale(): number {
    return this._body.getGravityScale();
  }
  set gravityScale(value: number) {
    this._body.setGravityScale(value);
  }

  /** 线性速度，物体当前运动速度向量 */
  get linearVelocity(): IPoint {
    return this._body.getLinearVelocity();
  }
  set linearVelocity(value: IPoint) {
    this._body.setLinearVelocity(value);
  }

  /** 线性阻尼系数，影响物体线性运动的减速率，值越大减速越快 */
  get linearDamping(): number {
    return this._body.getLinearDamping();
  }
  set linearDamping(value: number) {
    this._body.setLinearDamping(value);
  }

  /** 是否为子弹，高速物体设为true可减少穿透问题，但会增加性能开销 */
  get bullet(): boolean {
    return this._body.isBullet();
  }
  set bullet(value: boolean) {
    this._body.setBullet(value);
  }

  /** 是否允许旋转，设为false则物体保持固定方向 */
  get allowRotation(): boolean {
    return !this._body.isFixedRotation();
  }
  set allowRotation(value: boolean) {
    this._body.setFixedRotation(!value);
  }

  /** 是否允许休眠，休眠状态下物体不参与物理计算以提高性能 */
  get allowSleeping(): boolean {
    return this._body.isSleepingAllowed();
  }
  set allowSleeping(value: boolean) {
    this._body.setSleepingAllowed(value);
  }

  /** 是否处于休眠状态，休眠时物体暂停物理计算 */
  get sleeping(): boolean {
    return !this._body.isAwake();
  }
  set sleeping(value: boolean) {
    this._body.setAwake(!value);
  }

  /** 刚体质量，由形状和密度决定（只读） */
  get mass(): number {
    return this._body.getMass();
  }

  constructor(options?: RigidBodyOptions) {
    super();
    console.assert(this._physics !== undefined, "physics not init");
    this._body = this._physics.world.createBody({ active: false, type: "kinematic", fixedRotation: true });
    if (options) {
      this.setProps(options as Record<string, any>);
    }
  }

  /**
   * 组件唤醒时初始化物理刚体
   * 设置刚体类型、添加形状、设置初始位置和角度
   */
  onAwake(): void {
    const body = this._body;
    const target = this.target;

    if (this.rigidType === "dynamic") body.setDynamic();
    else if (this.rigidType === "static") body.setStatic();

    if (this.shapes.length) {
      for (const shape of this.shapes) {
        this.addShape(shape);
      }
    } else {
      this.addShape({ shapeType: "box" });
    }

    const tempPoint = Point.TEMP.set(0, 0);
    const worldPoint = target.toWorldPoint(tempPoint, tempPoint, this.scene);
    body.setPosition(this._physics.toPhPos(worldPoint));
    body.setAngle(target.rotation);
    body.setActive(true);
    body.setUserData(this);
  }

  /**
   * 每帧更新物体位置和旋转
   * 同步物理引擎计算结果到游戏对象，并检测边界
   */
  onUpdate(): void {
    if (this.rigidType === "static") return;
    const target = this.target;
    const pos = this._body.getPosition();

    // 复用临时对象
    let pos2D = this._physics.to2DPos(pos, this._tempPos2D);

    // 检测是否在全局边界内，不在则销毁 target
    if (!this._physics.inBoundaryArea(pos2D)) {
      this.target.destroy();
      return;
    }

    if (this.target.parent !== this.scene) {
      pos2D = this.target.parent!.toLocalPoint(pos2D, pos2D, this.scene);
    }
    target.pos.set(pos2D.x + target.pivot.x, pos2D.y + target.pivot.y);

    if (this.allowRotation) {
      target.rotation = this._body.getAngle() % PI2;
    }
    // console.log(pos.x, pos.y, this.target.pos.x, this.target.pos.y);
  }

  /**
   * 组件启用时激活物理刚体
   */
  onEnable(): void {
    this._body.setActive(true);
  }

  /**
   * 组件禁用时停用物理刚体
   */
  onDisable(): void {
    this._body.setActive(false);
  }

  /**
   * 组件销毁时清理物理刚体
   */
  onDestroy(): void {
    this._physics.world.destroyBody(this._body);
  }

  /**
   * 添加物理形状到刚体
   * 根据形状类型创建不同的碰撞区域，支持矩形、圆形、边缘线和多边形
   * @param shape - 要添加的形状配置
   */
  addShape(shape: IShape): void {
    if (!this.awaked) {
      this.shapes.push(shape);
      return;
    }

    const options = {
      density: 1,
      isSensor: this.isSensor,
      friction: this.friction,
      restitution: this.restitution,
      filterGroupIndex: 0,
      filterCategoryBits: this._physics.getCategoryBit(this.category),
      filterMaskBits: this._physics.getCategoryMask(this.categoryAccepted),
      ...shape,
    };
    const target = this.target;
    const rect = target.getWorldRotatingRect(this.scene);

    const physics = this._physics;
    const { pl } = physics;
    const toPh = physics.toPh.bind(physics);
    const toPhPos = physics.toPhPos.bind(physics);

    let fixture: Fixture | undefined = undefined;
    const offsetX = toPh((shape.offset?.x ?? 0) + target.pivot.x);
    const offsetY = toPh((shape.offset?.y ?? 0) + target.pivot.y);
    switch (shape.shapeType) {
      case "box": {
        const hw = toPh(shape.width ?? rect.width) / 2;
        const hh = toPh(shape.height ?? rect.height) / 2;
        fixture = this._body.createFixture(new pl.Box(hw, hh, { x: hw + offsetX, y: hh + offsetY }), options);
        break;
      }
      case "circle": {
        const radius = toPh(shape.radius ?? rect.height / 2);
        // 修正圆心位置，确保与物体中心对齐
        const centerX = offsetX + radius;
        const centerY = offsetY + radius;
        fixture = this._body.createFixture(new pl.Circle({ x: centerX, y: centerY }, radius), options);
        break;
      }
      case "chain": {
        const vertices = shape.points.map((point) => toPhPos({ x: point.x + offsetX, y: point.y + offsetY }));
        // 检查顶点数量是否合法
        console.assert(vertices.length >= 2, "Chain shape must have at least 2 vertices");
        if (vertices.length < 2) return;
        fixture = this._body.createFixture(new pl.Chain(vertices, false), options);
        break;
      }
      case "polygon": {
        const vertices = shape.points.map((point) => toPhPos({ x: point.x + offsetX, y: point.y + offsetY }));
        // 检查顶点数量是否合法
        console.assert(vertices.length >= 3 && vertices.length <= 8, "Polygon shape must have 3-8 vertices");
        if (vertices.length < 3 || vertices.length > 8) return;
        fixture = this._body.createFixture(new pl.Polygon(vertices), options);
        break;
      }
    }

    if (options.crossSide) {
      fixture?.setUserData({ crossSide: options.crossSide });
    }
  }

  /**
   * 设置刚体位置
   * 注意：如果物体使用了刚体，直接修改node.pos是无效的，需要使用此方法
   * @param x - x轴坐标
   * @param y - y轴坐标
   */
  setPosition(x: number, y: number): void {
    // 考虑 pivot 偏移
    const adjustedX = x - this.target.pivot.x;
    const adjustedY = y - this.target.pivot.y;

    let worldPos = { x: adjustedX, y: adjustedY };
    // 如果父节不是场景，需要转换到场景坐标
    if (this.target.parent !== this.scene) {
      worldPos = this.target.toWorldPoint(worldPos, worldPos, this.scene);
    }

    this._body.setPosition(this._physics.toPhPos(worldPos));
    if (this.rigidType !== "static") this._body.setAwake(true);
  }

  /**
   * 获取刚体当前位置
   * @returns 刚体位置坐标
   */
  getPosition(): IPoint {
    const pos = this._body.getPosition();
    return this._physics.to2DPos(pos);
  }

  /**
   * 获取刚体当前旋转角度
   * @returns 旋转角度（弧度）
   */
  getRotation(): number {
    return this._body.getAngle() % PI2;
  }

  /**
   * 设置刚体旋转角度
   * @param angle - 旋转角度（弧度）
   */
  setRotation(angle: number): void {
    this._body.setAngle(angle);
    if (this.rigidType !== "static") this._body.setAwake(true);
  }

  /**
   * 设置刚体线性速度
   * @param x - x方向速度，为undefined则保持当前速度
   * @param y - y方向速度，为undefined则保持当前速度
   */
  setLinearVelocity(x?: number, y?: number): void {
    this._body.setLinearVelocity({ x: x ?? this.linearVelocity.x, y: y ?? this.linearVelocity.y });
  }

  /**
   * 施加线性冲量，立即改变物体速度
   * 仅对dynamic类型物体有效，效果比施加力更直接
   * @param impulse - 冲量向量
   * @param point - 作用点，默认为物体原点
   */
  applyLinearImpulse(impulse: IPoint, point: IPoint = { x: 0, y: 0 }): void {
    console.assert(this.rigidType === "dynamic", "applyLinearImpulse only works on dynamic bodies");
    this._body.applyLinearImpulse(impulse, point, true);
  }

  /**
   * 施加力，会逐渐产生速度变化
   * 仅对dynamic类型物体有效，力量需足够大才能克服摩擦和重力
   * @param force - 力向量，包含 x 和 y 分量
   * @param point - 作用点，默认为物体原点，相对于物体中心的偏移
   */
  applyForce(force: IPoint, point: IPoint = { x: 0, y: 0 }): void {
    console.assert(this.rigidType === "dynamic", "applyForce only works on dynamic bodies");
    this._body.applyForce(force, point, true);
  }

  /**
   * 在物体中心点施加力，会逐渐改变物体速度
   * 仅对dynamic类型物体有效，力量需足够大才能克服摩擦和重力
   * @param force - 力向量
   */
  applyForceToCenter(force: IPoint): void {
    console.assert(this.rigidType === "dynamic", "applyForceToCenter only works on dynamic bodies");
    this._body.applyForceToCenter(force, true);
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
    this._body.applyTorque(torque, true);
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
    this._body.applyAngularImpulse(impulse, true);
  }
}
