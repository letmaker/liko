import type { Body, Joint } from 'planck';
import { EventType, PI2 } from '../const';
import { type IPoint, Point } from '../math/point';
import { BaseScript } from '../scripts/base-script';
import type { ICollision } from '../scripts/script';
import { RegScript } from '../utils/decorators';
import { addJoint } from './joint';
import type { IJoint, IShape, RigidBodyOptions, RigidType } from './rigidBody.interface';
import { addShape } from './shape';

/**
 * 物理刚体组件，实现物理属性描述和碰撞区域定义。
 *
 * 注意：RigidBody 为一个脚本，挂载到节点后，需要添加到场景中才能被激活
 *
 * @example
 * ```typescript
 * // 创建一个动态刚体
 * const rigidBody = new RigidBody({
 *   rigidType: 'dynamic',
 *   shapes: [{ shapeType: 'box', width: 100, height: 50 }],
 *   friction: 0.5,
 *   restitution: 0.3
 * });
 *
 * // 添加碰撞事件监听
 * rigidBody.onCollisionStart = (collision) => {
 *   console.log('碰撞开始:', collision);
 * };
 *
 * // 挂载到节点
 * myNode.addScript(rigidBody);
 *
 * // 施加力使物体移动
 * rigidBody.applyForce({ x: 100, y: 0 });
 *
 * // 设置速度
 * rigidBody.setLinearVelocity(50, -30);
 * ```
 */
@RegScript('RigidBody')
export class RigidBody extends BaseScript {
  private _tempPos2D: IPoint = { x: 0, y: 0 };
  private _joints: Joint[] = [];

  /** @private */
  physics = window.physics;
  /** @private */
  body: Body;

  /**
   * 物理刚体类型，决定物体的物理行为
   * - static: 静态物体，不受力影响，位置固定
   * - kinematic: 运动学物体，可以移动但不受力影响
   * - dynamic: 动态物体，受力影响并参与物理模拟
   *
   * 注意：至少一个物体为 dynamic 才能产生碰撞反应
   */
  rigidType: RigidType = 'static';

  /**
   * 物理形状列表，描述碰撞区域
   *
   * 注意：为空则默认使用与节点同大小的矩形
   */
  shapes: IShape[] = [];

  /**
   * 关节列表，描述刚体之间的连接关系
   *
   * 注意：关节会在组件唤醒时自动创建
   */
  joints: IJoint[] = [];

  /**
   * 物理分类标识，用于碰撞检测和过滤
   *
   * 注意：配合 categoryAccepted 使用可以控制哪些物体能够碰撞
   */
  category = '';

  /**
   * 是否为传感器模式
   *
   * 注意：传感器只检测碰撞但不产生物理反馈，常用于触发器
   */
  isSensor = false;

  /**
   * 摩擦系数，影响物体间的滑动阻力
   *
   * 取值范围：0-1，0 表示无摩擦，1 表示最大摩擦
   */
  friction = 0.2;

  /**
   * 弹性系数，影响碰撞后的反弹程度
   *
   * 取值范围：0-1，0 表示完全非弹性碰撞，1 表示完全弹性碰撞
   */
  restitution = 0;

  /**
   * 碰撞开始时的回调函数
   *
   * 注意：需要在组件唤醒前设置才能生效
   */
  onCollisionStart?: (e: ICollision) => void;

  /**
   * 碰撞结束时的回调函数
   *
   * 注意：需要在组件唤醒前设置才能生效
   */
  onCollisionEnd?: (e: ICollision) => void;

  private _categoryAccepted?: string[] | undefined;

  /**
   * 接受碰撞的分类列表，用于碰撞过滤
   *
   * 注意：为空则与所有物体碰撞，可以是字符串（逗号分隔）或字符串数组
   */
  get categoryAccepted(): string[] | undefined {
    return this._categoryAccepted;
  }
  set categoryAccepted(value: string | string[] | undefined) {
    if (typeof value === 'string') {
      this._categoryAccepted = value.split(/[,，]/);
    } else {
      this._categoryAccepted = value;
    }
  }

  /**
   * 角速度，物体旋转速度
   *
   * 单位：弧度/秒
   * 注意：只对 dynamic 类型物体有效
   */
  get angularVelocity(): number {
    return this.body.getAngularVelocity();
  }
  set angularVelocity(value: number) {
    this.body.setAngularVelocity(value);
  }

  /**
   * 角阻尼系数，影响物体旋转的减速率
   *
   * 注意：值越大减速越快，用于控制旋转的衰减
   */
  get angularDamping(): number {
    return this.body.getAngularDamping();
  }
  set angularDamping(value: number) {
    this.body.setAngularDamping(value);
  }

  /**
   * 重力缩放系数，控制物体受重力影响的程度
   *
   * 注意：默认为 1，可设为负值使物体上浮，设为 0 可忽略重力
   */
  get gravityScale(): number {
    return this.body.getGravityScale();
  }
  set gravityScale(value: number) {
    this.body.setGravityScale(value);
  }

  /**
   * 线性速度，物体当前运动速度向量
   *
   * 注意：只对 dynamic 和 kinematic 类型物体有效
   */
  get linearVelocity(): IPoint {
    return this.body.getLinearVelocity();
  }
  set linearVelocity(value: IPoint) {
    this.body.setLinearVelocity(value);
  }

  /**
   * 线性阻尼系数，影响物体线性运动的减速率
   *
   * 注意：值越大减速越快，用于控制移动的衰减
   */
  get linearDamping(): number {
    return this.body.getLinearDamping();
  }
  set linearDamping(value: number) {
    this.body.setLinearDamping(value);
  }

  /**
   * 是否为子弹模式，用于高速物体的连续碰撞检测
   *
   * 注意：高速物体设为 true 可减少穿透问题，但会增加性能开销
   */
  get bullet(): boolean {
    return this.body.isBullet();
  }
  set bullet(value: boolean) {
    this.body.setBullet(value);
  }

  /**
   * 是否允许旋转
   *
   * 注意：设为 false 则物体保持固定方向，不会因碰撞或力矩而旋转
   */
  get allowRotation(): boolean {
    return !this.body.isFixedRotation();
  }
  set allowRotation(value: boolean) {
    this.body.setFixedRotation(!value);
  }

  /**
   * 是否允许休眠，用于性能优化
   *
   * 注意：休眠状态下物体不参与物理计算以提高性能
   */
  get allowSleeping(): boolean {
    return this.body.isSleepingAllowed();
  }
  set allowSleeping(value: boolean) {
    this.body.setSleepingAllowed(value);
  }

  /**
   * 是否处于休眠状态
   *
   * 注意：休眠时物体暂停物理计算，可手动控制唤醒或休眠
   */
  get sleeping(): boolean {
    return !this.body.isAwake();
  }
  set sleeping(value: boolean) {
    this.body.setAwake(!value);
  }

  /**
   * 刚体质量，由形状和密度自动计算（只读）
   *
   * 注意：质量影响物体的惯性和力的响应，无法直接设置
   */
  get mass(): number {
    return this.body.getMass();
  }

  /**
   * 构造函数，创建物理刚体组件
   *
   * @param options 可选的初始化参数
   *
   * 注意：需要先启用物理系统才能创建刚体
   */
  constructor(options?: RigidBodyOptions) {
    super();
    if (!this.physics) {
      throw new Error('physics not init, please enable the physics system in app.init');
    }
    this.body = this.physics.world.createBody({ active: false, type: 'kinematic', fixedRotation: true });
    if (options) {
      this.setProps(options as unknown as Record<string, unknown>);
    }
  }

  /**
   * 组件唤醒时初始化物理刚体
   *
   * 设置刚体类型、添加形状、设置初始位置和角度，并注册碰撞事件和关节
   */
  override onAwake(): void {
    const body = this.body;
    const target = this.target;

    if (this.rigidType === 'dynamic') body.setDynamic();
    else if (this.rigidType === 'static') body.setStatic();

    if (this.shapes.length) {
      for (const shape of this.shapes) {
        addShape(this, shape);
      }
    } else {
      addShape(this, { shapeType: 'box' });
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
   *
   * 同步物理引擎计算结果到游戏对象，并检测边界。如果物体超出边界则销毁
   */
  override onUpdate(): void {
    if (this.rigidType === 'static') return;
    const target = this.target;
    const position = this.body.getPosition();

    // 复用临时对象
    let pos2D = this.physics.to2DPos(position, this._tempPos2D);

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

    // 使用scale的绝对值计算pivot偏移，避免负缩放时的位置错误
    const pivotX = target.pivot.x * Math.abs(target.scale.x);
    const pivotY = target.pivot.y * Math.abs(target.scale.y);
    if (target.rotation === 0) {
      target.position.set(pos2D.x + pivotX, pos2D.y + pivotY);
      return;
    }

    // 考虑旋转角度对 pivot 偏移的影响
    const cos = Math.cos(target.rotation);
    const sin = Math.sin(target.rotation);
    target.position.set(pos2D.x + (pivotX * cos - pivotY * sin), pos2D.y + (pivotX * sin + pivotY * cos));
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
   *
   * @param x x 轴坐标
   * @param y y 轴坐标
   *
   * 注意：如果物体使用了刚体，直接修改 node.position 是无效的，必须使用此方法
   */
  setPosition(x: number, y: number): void {
    let worldPos = { x, y };
    // 如果父节点不是场景，需要转换到场景坐标
    if (this.target.parent !== this.scene) {
      worldPos = this.target.parent!.localToWorld(worldPos, worldPos, this.scene);
    }

    this.body.setPosition(this.physics.toPhPos(worldPos));
    if (this.rigidType !== 'static') this.body.setAwake(true);
  }

  /**
   * 获取刚体当前位置
   *
   * @returns 刚体位置坐标
   */
  getPosition(): IPoint {
    const position = this.body.getPosition();
    return this.physics.to2DPos(position, position);
  }

  /**
   * 获取刚体当前旋转角度
   *
   * @returns 旋转角度（弧度）
   */
  getRotation(): number {
    return this.body.getAngle() % PI2;
  }

  /**
   * 设置刚体旋转角度
   *
   * @param rotation 旋转角度（弧度）
   *
   * 注意：会同时更新物理刚体和游戏对象的旋转
   */
  setRotation(rotation: number): void {
    this.body.setAngle(rotation);
    this.target.rotation = rotation;
    if (this.rigidType !== 'static') this.body.setAwake(true);
  }

  /**
   * 设置刚体线性速度
   *
   * @param x x 方向速度，为 undefined 则保持当前速度
   * @param y y 方向速度，为 undefined 则保持当前速度
   *
   * 注意：只对 dynamic 和 kinematic 类型物体有效
   */
  setLinearVelocity(x?: number, y?: number): void {
    this.body.setLinearVelocity({ x: x ?? this.linearVelocity.x, y: y ?? this.linearVelocity.y });
  }

  /**
   * 施加线性冲量，立即改变物体速度
   *
   * @param impulse 冲量向量
   * @param point 作用点，默认为物体原点
   *
   * 注意：仅对 dynamic 类型物体有效，效果比施加力更直接
   */
  applyLinearImpulse(impulse: IPoint, point: IPoint = { x: 0, y: 0 }): void {
    // TODO 换成错误 throw 出来更好？
    console.assert(this.rigidType === 'dynamic', 'applyLinearImpulse only works on dynamic bodies');
    this.body.applyLinearImpulse(impulse, point, true);
  }

  /**
   * 施加力，会逐渐产生速度变化
   *
   * @param force 力向量，包含 x 和 y 分量
   * @param point 作用点，默认为物体原点，相对于物体中心的偏移
   *
   * 注意：仅对 dynamic 类型物体有效，力量需足够大才能克服摩擦和重力
   */
  applyForce(force: IPoint, point: IPoint = { x: 0, y: 0 }): void {
    console.assert(this.rigidType === 'dynamic', 'applyForce only works on dynamic bodies');
    this.body.applyForce(force, point, true);
  }

  /**
   * 在物体中心点施加力，会逐渐改变物体速度
   *
   * @param force 力向量
   *
   * 注意：仅对 dynamic 类型物体有效，力量需足够大才能克服摩擦和重力
   */
  applyForceToCenter(force: IPoint): void {
    console.assert(this.rigidType === 'dynamic', 'applyForceToCenter only works on dynamic bodies');
    this.body.applyForceToCenter(force, true);
  }

  /**
   * 施加扭矩，会逐渐产生角速度变化
   *
   * @param torque 扭矩值
   *
   * 注意：仅对 dynamic 类型且 allowRotation 为 true 的物体有效
   */
  applyTorque(torque: number): void {
    console.assert(
      this.rigidType === 'dynamic' && this.allowRotation,
      'applyTorque only works on dynamic bodies with allowRotation enabled'
    );
    this.body.applyTorque(torque, true);
  }

  /**
   * 施加角冲量，立即改变物体角速度
   *
   * @param impulse 角冲量值
   *
   * 注意：仅对 dynamic 类型且 allowRotation 为 true 的物体有效
   */
  applyAngularImpulse(impulse: number): void {
    console.assert(
      this.rigidType === 'dynamic' && this.allowRotation,
      'applyAngularImpulse only works on dynamic bodies with allowRotation enabled'
    );
    this.body.applyAngularImpulse(impulse, true);
  }

  /**
   * 销毁指定标签的关节
   *
   * @param label 关节标签
   *
   * 注意：销毁后关节连接将断开，相关物体将不再约束
   */
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
