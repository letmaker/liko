import { Rectangle } from '../../math/rectangle';
import type { LikoNode } from '../../nodes/node';
import { BaseScript } from '../base-script';

/**
 * 摄像机控制脚本，scene 上面默认自带 camera 脚本实例
 *
 * 提供平滑的摄像机跟随功能，支持：
 * - 目标跟随：自动跟随指定节点
 * - 平滑缓动：避免摄像机移动过于突兀
 * - 边界限制：防止摄像机移动超出指定区域
 * - 轴向控制：可单独控制X/Y轴跟随
 * - 位置偏移：支持在目标位置基础上添加偏移
 *
 * @example
 * ```typescript
 * // 使用 scene 上面的 camera 脚本实例
 * const camera = scene.camera;
 *
 * // 基本跟随
 * camera.followTarget(playerNode);
 *
 * // 自定义跟随配置
 * camera.followTarget(playerNode, {
 *   followY: false,        // 仅跟随X轴
 *   offsetX: 100,          // X轴偏移100像素
 *   immediate: true        // 立即移动到目标位置
 * });
 *
 * // 设置边界限制
 * camera.setWorldBounds(new Rectangle(0, 0, 2000, 1200));
 *
 * // 调整跟随参数
 * camera.smoothness = 0.05;  // 更平滑的跟随
 * camera.followEnabled = false; // 暂停跟随
 *
 * // 手动控制摄像机
 * camera.lookAt(500, 300);          // 平滑移动到指定位置
 * camera.lookAt(500, 300, true);    // 立即移动到指定位置
 *
 * // 获取摄像机状态
 * const currentPos = camera.getCurrentPosition();
 * const isReady = camera.isAtTarget();
 * ```
 */
export class Camera extends BaseScript {
  /**
   * 是否启用跟随
   * 设置为 false 会暂停跟随，但不会停止平滑移动
   */
  followEnabled = true;

  /**
   * 缓动系数 (0-1)
   * - 0: 不跟随（摄像机保持静止）
   * - 1: 立即跟随（无缓动效果）
   * - 0.1: 平滑跟随（推荐值）
   *
   * 注意：值越小跟随越平滑，但响应速度越慢
   */
  smoothness = 0.1;

  /**
   * 是否跟随X轴方向
   * 设置为 false 时摄像机在X轴方向保持静止
   */
  followX = true;

  /**
   * 是否跟随Y轴方向
   * 设置为 false 时摄像机在Y轴方向保持静止
   */
  followY = true;

  /**
   * X轴偏移量（相对于目标中心），正值向右偏移，负值向左偏移
   */
  offsetX = 0;

  /**
   * Y轴偏移量（相对于目标中心），正值向下偏移，负值向上偏移
   */
  offsetY = 0;

  /** 当前跟随的目标节点 */
  private _targetNode?: LikoNode;
  /** 摄像机移动的世界坐标边界约束（用户设置的原始边界） */
  private _worldBounds?: Rectangle;
  /** 场景坐标系下的边界约束（经过转换后的边界） */
  private _sceneConstraints?: Rectangle;
  /** 摄像机的目标X坐标（场景坐标系） */
  private _targetSceneX = 0;
  /** 摄像机的目标Y坐标（场景坐标系） */
  private _targetSceneY = 0;
  /** 摄像机的当前X坐标（场景坐标系） */
  private _currentSceneX = 0;
  /** 摄像机的当前Y坐标（场景坐标系） */
  private _currentSceneY = 0;

  /**
   * 摄像机移动边界约束（世界坐标系）
   * 设置后会自动转换为场景坐标系约束
   *
   * 注意：边界区域必须大于等于舞台尺寸，否则摄像机将被限制移动
   */
  get worldBounds(): Rectangle | undefined {
    return this._worldBounds;
  }

  set worldBounds(worldBounds: Rectangle | undefined) {
    this._worldBounds = worldBounds;
    this._updateSceneConstraints();
  }

  /**
   * 设置摄像机跟随目标
   *
   * @param target 要跟随的节点
   * @param options 跟随配置选项
   * @param options.followX 是否跟随X轴，默认true
   * @param options.followY 是否跟随Y轴，默认true
   * @param options.offsetX X轴偏移量，默认0
   * @param options.offsetY Y轴偏移量，默认0
   * @param options.immediate 是否立即同步到目标位置，默认true
   *
   * 注意：调用此方法会覆盖之前设置的跟随配置
   */
  followTarget(
    target: LikoNode,
    options?: {
      /** 是否跟随X轴，默认true */
      followX?: boolean;
      /** 是否跟随Y轴，默认true */
      followY?: boolean;
      /** X轴偏移量，默认0 */
      offsetX?: number;
      /** Y轴偏移量，默认0 */
      offsetY?: number;
      /** 是否立即同步到目标位置，默认true */
      immediate?: boolean;
    }
  ): void {
    this._targetNode = target;

    // 应用配置选项
    this.followX = options?.followX ?? true;
    this.followY = options?.followY ?? true;
    this.offsetX = options?.offsetX ?? 0;
    this.offsetY = options?.offsetY ?? 0;

    if (options?.immediate ?? true) {
      // 立即同步到目标位置，避免初始跳跃
      this.snapToTarget();
    }
  }

  /**
   * 让摄像机查看指定位置
   *
   * @param x X坐标（世界坐标）
   * @param y Y坐标（世界坐标）
   * @param immediate 是否立即移动，默认false（使用平滑移动）
   *
   * 注意：此方法不会改变跟随目标，如果有跟随目标，下一帧会继续跟随
   */
  lookAt(x: number, y: number, immediate = false): void {
    this._calculateTargetScenePosition(x, y);

    if (immediate) {
      this._currentSceneX = this._targetSceneX;
      this._currentSceneY = this._targetSceneY;
      this._updateScenePosition();
    }
  }

  /**
   * 设置摄像机移动边界
   *
   * @param worldBounds 边界矩形区域（世界坐标系）
   *
   * 注意：边界区域应该大于等于舞台尺寸，否则摄像机移动会受到限制
   */
  setWorldBounds(worldBounds: Rectangle): void {
    this.worldBounds = worldBounds;
  }

  /**
   * 立即移动摄像机到目标位置（无缓动）
   *
   * 注意：只有在设置了跟随目标的情况下才会生效
   */
  snapToTarget(): void {
    if (!this._targetNode) return;

    this._calculateTargetPositionFromNode(this._targetNode);
    this._applyBoundsConstraint();

    if (this.followX) {
      this._currentSceneX = this._targetSceneX;
    }

    if (this.followY) {
      this._currentSceneY = this._targetSceneY;
    }

    this._updateScenePosition();
  }

  /**
   * 获取当前摄像机位置（场景坐标系）
   *
   * @returns 包含x和y坐标的对象
   */
  getCurrentPosition(): { x: number; y: number } {
    return {
      x: this._currentSceneX,
      y: this._currentSceneY,
    };
  }

  /**
   * 获取摄像机目标位置（场景坐标系）
   *
   * @returns 包含x和y坐标的对象
   */
  getTargetPosition(): { x: number; y: number } {
    return {
      x: this._targetSceneX,
      y: this._targetSceneY,
    };
  }

  /**
   * 检查摄像机是否已到达目标位置
   *
   * @param threshold 判定阈值（像素），默认1像素
   * @returns 是否已到达目标位置
   *
   * 注意：当smoothness较小时，摄像机可能永远无法完全到达目标位置，建议使用合适的threshold值
   */
  isAtTarget(threshold = 1): boolean {
    const deltaX = Math.abs(this._currentSceneX - this._targetSceneX);
    const deltaY = Math.abs(this._currentSceneY - this._targetSceneY);
    return deltaX < threshold && deltaY < threshold;
  }

  override onCreate(): void {
    // 初始化摄像机位置为当前场景位置
    if (this.target?.scene) {
      this._currentSceneX = this.target.scene.position.x;
      this._currentSceneY = this.target.scene.position.y;
    }
  }

  override onAwake(): void {
    // 如果设置了跟随目标，立即同步到目标位置
    if (this._targetNode) {
      this.snapToTarget();
    }
  }

  override onUpdate(delta: number): void {
    if (!this._targetNode) return;

    // 更新目标位置
    if (this.followEnabled) {
      this._calculateTargetPositionFromNode(this._targetNode);
    }

    // 应用边界约束
    this._applyBoundsConstraint();

    // 应用平滑缓动
    this._applySmoothMovement(delta);

    // 更新场景位置
    this._updateScenePosition();
  }

  override onDestroy(): void {
    this._targetNode = undefined;
    this.worldBounds = undefined;
  }

  /**
   * 根据世界坐标边界更新场景坐标系约束
   *
   * 坐标系转换说明：
   * - 世界坐标：节点在游戏世界中的绝对位置
   * - 场景坐标：scene.position，控制整个场景的偏移
   * - 摄像机向右移动 = 场景向左移动（scene.position.x减小）
   */
  private _updateSceneConstraints(): void {
    if (!this._worldBounds || !this.stage) {
      this._sceneConstraints = undefined;
      return;
    }

    const worldBounds = this._worldBounds;

    // 计算摄像机左上角在世界坐标系中的可移动范围
    const minCameraWorldX = worldBounds.x;
    const maxCameraWorldX = worldBounds.x + worldBounds.width - this.stage.width;
    const minCameraWorldY = worldBounds.y;
    const maxCameraWorldY = worldBounds.y + worldBounds.height - this.stage.height;

    // 转换为场景坐标约束
    // 摄像机世界坐标 = -scene.position，所以 scene.position = -摄像机世界坐标
    const maxSceneX = -minCameraWorldX; // 场景X的最大值
    const minSceneX = -maxCameraWorldX; // 场景X的最小值
    const maxSceneY = -minCameraWorldY; // 场景Y的最大值
    const minSceneY = -maxCameraWorldY; // 场景Y的最小值

    // 如果边界区域小于舞台尺寸，则限制摄像机移动
    const constraintWidth = Math.max(0, maxSceneX - minSceneX);
    const constraintHeight = Math.max(0, maxSceneY - minSceneY);

    this._sceneConstraints = new Rectangle(minSceneX, minSceneY, constraintWidth, constraintHeight);
  }

  /**
   * 根据目标节点计算摄像机应该移动到的位置
   */
  private _calculateTargetPositionFromNode(targetNode: LikoNode): void {
    if (!this.scene || !this.stage) return;

    // 获取目标节点的世界坐标中心点
    const worldCenter = this._getNodeWorldCenter(targetNode);

    // 计算为了让目标居中所需的场景位置
    this._calculateTargetScenePosition(worldCenter.x, worldCenter.y);
  }

  /**
   * 根据世界坐标计算场景目标位置
   */
  private _calculateTargetScenePosition(worldX: number, worldY: number): void {
    if (!this.scene || !this.stage) return;

    if (this.followX) {
      // 计算为了让目标在屏幕中心，场景需要的X偏移
      const offsetToCenter = this.stage.width / 2 - worldX;
      this._targetSceneX = this.scene.position.x + offsetToCenter + this.offsetX;
    }

    if (this.followY) {
      // 计算为了让目标在屏幕中心，场景需要的Y偏移
      const offsetToCenter = this.stage.height / 2 - worldY;
      this._targetSceneY = this.scene.position.y + offsetToCenter + this.offsetY;
    }
  }

  /**
   * 获取节点在世界坐标系中的中心点
   */
  private _getNodeWorldCenter(node: LikoNode): { x: number; y: number } {
    // 获取节点的本地边界框
    const localBounds = node.getLocalBounds();
    const centerX = localBounds.width / 2;
    const centerY = localBounds.height / 2;
    const localCenter = { x: centerX, y: centerY };

    // 转换为世界坐标
    return node.localToWorld(localCenter, localCenter);
  }

  /**
   * 应用边界约束，确保摄像机不会移动到边界外
   */
  private _applyBoundsConstraint(): void {
    if (!this._sceneConstraints) return;

    const { left, right, top, bottom } = this._sceneConstraints;

    if (this.followX) {
      this._targetSceneX = Math.max(left, Math.min(right, this._targetSceneX));
    }

    if (this.followY) {
      this._targetSceneY = Math.max(top, Math.min(bottom, this._targetSceneY));
    }
  }

  /**
   * 应用平滑移动效果
   */
  private _applySmoothMovement(deltaTime: number): void {
    if (this.smoothness <= 0) {
      return;
    }

    // 计算基于帧率的缓动因子
    // 使用固定帧时间作为基准，确保在不同帧率下缓动效果一致
    const frameFactor = Math.min(1, this.smoothness * (deltaTime / 0.016));

    if (this.followX) {
      this._currentSceneX += (this._targetSceneX - this._currentSceneX) * frameFactor;
    }

    if (this.followY) {
      this._currentSceneY += (this._targetSceneY - this._currentSceneY) * frameFactor;
    }
  }

  /**
   * 更新场景位置
   */
  private _updateScenePosition(): void {
    if (!this.scene) return;

    if (this.followX) {
      this.scene.position.x = this._currentSceneX;
    }

    if (this.followY) {
      this.scene.position.y = this._currentSceneY;
    }
  }
}
