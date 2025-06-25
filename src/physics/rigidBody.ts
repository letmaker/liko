import type { Body, Joint } from 'planck';
import { EventType, PI2 } from '../const';
import { type IPoint, Point } from '../math/point';
import { Shape } from '../nodes/shape';
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
 * 重要提示：
 * 1. 使用前必须先在 app.init() 中启用物理系统
 * 2. 不能直接修改 node.position，必须使用 setPosition()
 * 3. 物理世界中的位置和游戏世界位置会自动同步
 * 4. 至少需要一个 dynamic 类型物体才能产生真实的碰撞反应
 * 5. 物体超出物理世界边界会自动销毁
 *
 * @example
 * ```typescript
 * // 1. 首先确保物理系统已启用
 * await app.init({ physics: true });
 *
 * // 2. 创建一个动态刚体（会受重力和力的影响）
 * const rigidBody = new RigidBody({
 *   rigidType: 'dynamic',
 *   shapes: [{ shapeType: 'box', width: 100, height: 50 }],
 *   friction: 0.5,        // 摩擦系数
 *   restitution: 0.3,     // 弹性系数
 *   category: 'player',   // 碰撞分类
 *   categoryAccepted: ['enemy', 'wall'] // 只与这些分类碰撞，默认为所有分类
 * });
 *
 * // 3. 添加碰撞事件监听（必须在 addScript 之前设置）
 * rigidBody.onCollisionStart = (collision) => {
 *   console.log('开始碰撞:', collision.other.category);
 * };
 * rigidBody.onCollisionEnd = (collision) => {
 *   console.log('结束碰撞:', collision.other.category);
 * };
 *
 * // 4. 挂载到节点并添加到场景
 * myNode.addScript(rigidBody);
 * scene.addChild(myNode);
 *
 * // 5. 控制物体运动（只能在激活后使用）
 * rigidBody.applyForce({ x: 100, y: 0 });           // 施加持续力
 * rigidBody.applyLinearImpulse({ x: 50, y: -100 }); // 施加瞬间冲量
 * rigidBody.setLinearVelocity(50, -30);             // 直接设置速度
 * rigidBody.setPosition(100, 200);                  // 设置位置
 *
 * // 6. 动态控制刚体
 * rigidBody.enabled = false;    // 禁用物理模拟
 * rigidBody.bullet = true;      // 开启高速物体模式防止穿透
 * ```
 *
 * @example
 * ```typescript
 * // 创建传感器（只检测碰撞不产生物理反应）
 * const sensor = new RigidBody({
 *   rigidType: 'static',
 *   isSensor: true,
 *   shapes: [{ shapeType: 'circle', radius: 50 }]
 * });
 * sensor.onCollisionStart = (collision) => {
 *   console.log('触发器被激活');
 * };
 * ```
 *
 * @example
 * ```typescript
 * // 创建复杂形状的刚体
 * const complexBody = new RigidBody({
 *   rigidType: 'dynamic',
 *   shapes: [
 *     { shapeType: 'box', width: 50, height: 100, offset: { x: 0, y: 0 } },
 *     { shapeType: 'circle', radius: 25, offset: { x: 60, y: 0 } }
 *   ],
 *   joints: [
 *     {
 *       jointType: 'revolute',
 *       bodyB: 'otherBodyLabel',
 *       anchor: { x: 0, y: 0 },
 *       label: 'hingeJoint'
 *     }
 *   ]
 * });
 * ```
 *
 * 常见错误：
 * - ❌ 直接修改 node.position（无效）
 * - ❌ 忘记启用物理系统
 * - ❌ 没有将节点添加到场景中
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
   *
   * 类型说明：
   * - **static**: 静态物体，位置固定，不受力和重力影响
   *   - 用途：地面、墙体、平台等不动的物体
   *   - 性能：最佳，不参与物理计算
   *   - 碰撞：可以与其他物体碰撞，但自身不会移动
   *
   * - **kinematic**: 运动学物体，可手动控制移动，不受重力影响
   *   - 用途：移动平台、电梯、玩家控制的角色
   *   - 性能：较好，只计算位置变化
   *   - 碰撞：可以推动 dynamic 物体，自身不受推力影响
   *
   * - **dynamic**: 动态物体，受力、重力影响，完全参与物理模拟
   *   - 用途：可被推动、抛掷的物体，如箱子、球、子弹
   *   - 性能：最差，需要完整物理计算
   *   - 碰撞：与所有类型物体产生真实的物理反应
   *
   * 重要注意事项：
   * 1. 至少需要一个 dynamic 物体才能产生真实的碰撞反应
   * 2. 物理的物体，禁止直接修改 node.position 或使用 Tween 移动
   * 3. 必须使用 rigidBody.setPosition() 或物理力来控制位置
   * 4. 类型可以在运行时改变，但会重置物理状态，比如从 static 变为 dynamic
   */
  rigidType: RigidType = 'static';

  /**
   * 物理形状列表，描述碰撞区域
   *
   * 支持的形状类型：
   * - **box**: 矩形，最常用的形状
   *   - 参数：width, height, offset（可选）
   * - **circle**: 圆形，适合球类物体
   *   - 参数：radius, offset（可选）
   * - **polygon**: 多边形，适合复杂形状
   *   - 参数：vertices（顶点数组）, offset（可选）
   * - **chain**: 链条，适合地形和边界
   *   - 参数：vertices（顶点数组）, offset（可选）
   *   - 注意：不封闭，只有边界，通常用于地形
   *
   * 重要说明：
   * 1. 为空则默认使用与节点同大小的矩形
   * 2. 可以添加多个形状组成复杂碰撞体
   * 3. 每个形状可以设置独立的 offset 偏移量
   * 4. 形状的坐标是相对于节点左上角
   * 5. 形状会影响质量计算，需要设置合适的密度
   *
   * @example
   * ```typescript
   * // 单个矩形
   * shapes: [{ shapeType: 'box', width: 100, height: 50 }]
   *
   * // 单个圆形
   * shapes: [{ shapeType: 'circle', radius: 25 }]
   *
   * // 复杂形状组合（L形）
   * shapes: [
   *   { shapeType: 'box', width: 100, height: 20, offset: { x: 0, y: -15 } },
   *   { shapeType: 'box', width: 20, height: 80, offset: { x: -40, y: 15 } }
   * ]
   *
   * // 多边形（三角形）
   * shapes: [{
   *   shapeType: 'polygon',
   *   vertices: [{ x: 0, y: -25 }, { x: -25, y: 25 }, { x: 25, y: 25 }]
   * }]
   *
   * // 地形链条
   * shapes: [{
   *   shapeType: 'chain',
   *   vertices: [{ x: -100, y: 0 }, { x: -50, y: -20 }, { x: 0, y: 0 }, { x: 50, y: 10 }, { x: 100, y: -10 }]
   * }]
   * ```
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
   * 碰撞过滤机制：
   * 1. 如果为 undefined 或空数组，则与所有物体碰撞
   * 2. 如果有值，则只与列表中指定分类的物体碰撞
   * 3. 双方的 categoryAccepted 都需要包含对方的 category 才能碰撞
   * 4. 传感器模式不受此限制影响
   *
   * 支持格式：
   * - 字符串数组：['player', 'enemy', 'wall']
   * - 逗号分隔字符串：'player,enemy,wall' 或 'player，enemy，wall'
   *
   * @example
   * ```typescript
   * // 玩家只与敌人和墙体碰撞
   * player.category = 'player';
   * player.categoryAccepted = ['enemy', 'wall'];
   *
   * // 敌人只与玩家碰撞
   * enemy.category = 'enemy';
   * enemy.categoryAccepted = ['player'];
   *
   * // 墙体与所有物体碰撞
   * wall.category = 'wall';
   * wall.categoryAccepted = undefined;  // 或 []
   *
   * // 字符串格式
   * bullet.categoryAccepted = 'enemy,wall';
   * ```
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

    if (!this.shapes.length) {
      this.shapes.push({ shapeType: 'box' });
    }
    for (const shape of this.shapes) {
      addShape(this, shape);
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

    if (this.physics.debugState) {
      this._showDebugBounds();
    }
    console.log('onAwake', this.target.label);
  }

  private _showDebugBounds() {
    const lineWidth = 2;
    for (const shape of this.shapes) {
      const offset = shape.offset ?? { x: 0, y: 0 };
      switch (shape.shapeType) {
        case 'box': {
          new Shape({
            label: 'debugRigidBody',
            alpha: 0.5,
            parent: this.target,
            drawRect: {
              x: offset.x,
              y: offset.y,
              width: shape.width ?? this.target.width,
              height: shape.height ?? this.target.height,
              stroke: 'red',
              strokeWidth: lineWidth,
            },
          });
          break;
        }
        case 'circle': {
          const radius = shape.radius ?? this.target.width / 2;
          new Shape({
            label: 'debugRigidBody',
            alpha: 0.5,
            parent: this.target,
            drawCircle: {
              x: offset.x + radius,
              y: offset.y + radius,
              radius,
              stroke: 'red',
              strokeWidth: lineWidth,
            },
          });
          break;
        }
        case 'polygon': {
          new Shape({
            label: 'debugRigidBody',
            alpha: 0.5,
            parent: this.target,
            drawPolygon: {
              points: shape.vertices.map((v) => ({ x: v.x + offset.x, y: v.y + offset.y })),
              stroke: 'red',
              strokeWidth: lineWidth,
            },
          });
          break;
        }
        case 'chain': {
          new Shape({
            label: 'debugRigidBody',
            alpha: 0.5,
            parent: this.target,
            drawLine: {
              points: shape.vertices.map((v) => ({ x: v.x + offset.x, y: v.y + offset.y })),
              color: 'red',
              lineWidth: lineWidth,
            },
          });
        }
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
    console.log('onUpdate', this.target.label);

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
   * @param x x 轴坐标（游戏世界坐标系）
   * @param y y 轴坐标（游戏世界坐标系）
   *
   * 重要注意事项：
   * 1. 如果物体使用了刚体，直接修改 node.position 是无效的，必须使用此方法
   * 2. 坐标系为游戏世界坐标，会自动转换为物理世界坐标
   * 3. 会自动处理父节点的坐标变换
   * 4. 对于非静态刚体，会自动唤醒物体以使改变生效
   * 5. 频繁调用此方法可能影响性能，建议优先使用力和冲量控制运动
   *
   * @example
   * ```typescript
   * // 直接设置位置
   * rigidBody.setPosition(100, 200);
   *
   * // 错误用法：不要直接设置 node.position（无效）
   * // node.position.set(100, 200); // ❌ 这样不会生效
   * ```
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
   * @param x x 方向速度（像素/秒），为 undefined 则保持当前速度
   * @param y y 方向速度（像素/秒），为 undefined 则保持当前速度
   *
   * 注意事项：
   * 1. 只对 dynamic 和 kinematic 类型物体有效
   * 2. 会立即改变物体的运动状态，不考虑加速度过程
   * 3. 可以单独设置 x 或 y 方向的速度
   * 4. 正值表示向右/向下，负值表示向左/向上
   *
   * @example
   * ```typescript
   * // 设置完整速度
   * rigidBody.setLinearVelocity(100, -50);  // 向右上方运动
   *
   * // 只改变 x 方向速度，保持 y 方向不变
   * rigidBody.setLinearVelocity(0);  // 水平运动
   *
   * // 只改变 y 方向速度
   * rigidBody.setLinearVelocity(undefined, 200);  // 向下加速
   * ```
   */
  setLinearVelocity(x?: number, y?: number): void {
    this.body.setLinearVelocity({ x: x ?? this.linearVelocity.x, y: y ?? this.linearVelocity.y });
  }

  /**
   * 施加线性冲量，立即改变物体速度
   *
   * @param impulse 冲量向量（牛顿·秒，N·s），相当于质量×速度变化
   * @param point 作用点，默认为物体中心，相对于物体中心的偏移（像素）
   *
   * 重要说明：
   * 1. 仅对 dynamic 类型物体有效，static 和 kinematic 类型无效
   * 2. 立即改变物体速度，不需要累积
   * 3. 效果比施加力更直接，适合模拟瞬间事件
   * 4. 作用点偏离中心会产生角冲量，影响旋转
   * 5. 冲量会立即生效，不需要等待下一帧
   *
   * 适用场景：
   * - 跳跃：向上施加冲量
   * - 爆炸：从爆炸中心向外施加冲量
   * - 碰撞反弹：根据碰撞角度施加冲量
   * - 发射子弹：瞬间给予初始速度
   *
   * @example
   * ```typescript
   * // 跳跃
   * rigidBody.applyLinearImpulse({ x: 0, y: -300 });
   *
   * // 向右发射
   * rigidBody.applyLinearImpulse({ x: 500, y: 0 });
   *
   * // 爆炸效果：从爆炸点计算方向
   * const direction = { x: playerX - explosionX, y: playerY - explosionY };
   * const distance = Math.sqrt(direction.x ** 2 + direction.y ** 2);
   * const impulse = { x: direction.x / distance * 1000, y: direction.y / distance * 1000 };
   * rigidBody.applyLinearImpulse(impulse);
   *
   * // 在边缘施加冲量产生旋转
   * rigidBody.applyLinearImpulse({ x: 200, y: 0 }, { x: 0, y: -50 });
   * ```
   */
  applyLinearImpulse(impulse: IPoint, point: IPoint = { x: 0, y: 0 }): void {
    // TODO 换成错误 throw 出来更好？
    console.assert(this.rigidType === 'dynamic', 'applyLinearImpulse only works on dynamic bodies');
    this.body.applyLinearImpulse(impulse, point, true);
  }

  /**
   * 施加力，会逐渐产生速度变化
   *
   * @param force 力向量，包含 x 和 y 分量（牛顿，N）
   * @param point 作用点，默认为物体中心，相对于物体中心的偏移（像素）
   *
   * 重要说明：
   * 1. 仅对 dynamic 类型物体有效，static 和 kinematic 类型无效
   * 2. 力的作用是累积的，每帧都会影响物体加速度
   * 3. 力量需足够大才能克服摩擦和重力
   * 4. 作用点偏离中心会产生扭矩，使物体旋转
   * 5. 力会在下一帧物理更新时生效
   *
   * 与冲量的区别：
   * - applyForce: 持续施加力，逐渐加速（如火箭推进器）
   * - applyLinearImpulse: 瞬间改变速度（如撞击、跳跃）
   *
   * @example
   * ```typescript
   * // 向右施加推力
   * rigidBody.applyForce({ x: 1000, y: 0 });
   *
   * // 在物体上方施加向下的力，会产生顺时针旋转
   * rigidBody.applyForce({ x: 0, y: 500 }, { x: 50, y: 0 });
   *
   * // 模拟重力（如果要覆盖默认重力）
   * rigidBody.applyForce({ x: 0, y: rigidBody.mass * 980 });
   *
   * // 模拟风力
   * rigidBody.applyForce({ x: -200, y: 0 });  // 向左的风
   * ```
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

    if (this.physics.debugState) {
      for (let i = this.target.children.length - 1; i >= 0; i--) {
        const child = this.target.children[i];
        if (child.label === 'debugRigidBody') {
          child.destroy();
        }
      }
    }
  }
}
