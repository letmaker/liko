import { Rectangle } from '../../math/rectangle';
import type { LikoNode } from '../../nodes/node';
import { BaseScript } from '../base-script';

/**
 * 摄像机控制脚本
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
 * // 基本使用
 * camera.followTarget(playerNode);
 *
 * // 仅跟随X轴，带偏移
 * camera.followTarget(playerNode, {
 *   followY: false,
 *   offsetX: 100
 * });
 *
 * // 设置边界限制
 * camera.setBounds({ left: 0, right: 1000, top: 0, bottom: 600 });
 * ```
 */
export class Camera extends BaseScript {
  private _followTarget?: LikoNode;

  /**
   * 缓动系数 (0-1)
   * - 0: 不跟随
   * - 1: 立即跟随
   * - 0.1: 平滑跟随（推荐值）
   */
  smoothness = 0.1;

  /** 是否跟随X轴方向 */
  followX = true;
  /** 是否跟随Y轴方向 */
  followY = true;
  /** X轴偏移量（相对于目标中心） */
  offsetX = 0;
  /** Y轴偏移量（相对于目标中心） */
  offsetY = 0;

  private _bounds?: Rectangle | undefined;
  private _sceneBounds?: Rectangle;

  /** 摄像机移动边界约束 */
  get bounds(): Rectangle | undefined {
    return this._bounds;
  }
  set bounds(value: Rectangle | undefined) {
    this._bounds = value;
    if (value && this.stage) {
      // 计算摄像机左上角的可移动范围
      const minCameraX = value.x;
      const maxCameraX = value.x + value.width - this.stage.width;
      const minCameraY = value.y;
      const maxCameraY = value.y + value.height - this.stage.height;

      // 转换为场景坐标约束（scene.position的范围）
      // 摄像机向右移动时，场景向左移动（负方向）
      const maxSceneX = -minCameraX; // 场景X的最大值
      const minSceneX = -maxCameraX; // 场景X的最小值
      const maxSceneY = -minCameraY; // 场景Y的最大值
      const minSceneY = -maxCameraY; // 场景Y的最小值

      // 如果bounds区域小于stage，则不允许摄像机移动
      const sceneWidth = Math.max(0, maxSceneX - minSceneX);
      const sceneHeight = Math.max(0, maxSceneY - minSceneY);

      this._sceneBounds = new Rectangle(minSceneX, minSceneY, sceneWidth, sceneHeight);
    } else {
      this._sceneBounds = undefined;
    }
  }

  // 内部状态变量
  private _targetX = 0;
  private _targetY = 0;
  private _currentX = 0;
  private _currentY = 0;

  /**
   * 设置摄像机跟随目标
   *
   * @param target 要跟随的节点
   * @param options 跟随配置选项
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
    this._followTarget = target;

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
   * 直接设置摄像机查看位置
   *
   * @param x X坐标（全局坐标）
   * @param y Y坐标（全局坐标）
   * @param immediate 是否立即移动（跳过缓动）
   */
  setPosition(x: number, y: number, immediate = false): void {
    this._targetX = x;
    this._targetY = y;

    if (immediate) {
      this._currentX = this._targetX;
      this._currentY = this._targetY;
      this._applyCameraPosition();
    }
  }

  /**
   * 设置摄像机移动边界
   *
   * @param bounds 边界矩形区域
   */
  setBounds(bounds: Rectangle): void {
    this.bounds = bounds;
  }

  /**
   * 立即移动摄像机到目标位置（无缓动）
   */
  snapToTarget(): void {
    if (!this._followTarget) return;

    this._calculateTargetPosition(this._followTarget);

    // 应用边界约束，确保不会越界
    this._applyBoundsConstraint();

    if (this.followX) {
      this._currentX = this._targetX;
    }

    if (this.followY) {
      this._currentY = this._targetY;
    }

    this._applyCameraPosition();
  }

  private _calculateTargetPosition(target: LikoNode): void {
    if (!this.scene || !this.stage) return;

    // 获取节点的本地边界框，计算中心点
    const bounds = target.getLocalBounds();
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const localCenter = { x: centerX, y: centerY };

    // 转换为世界坐标
    const worldCenter = target.localToWorld(localCenter, localCenter);

    // 计算为了让目标居中，场景需要移动的距离
    if (this.followX) {
      const offsetToCenter = this.stage.width / 2 - worldCenter.x;
      this._targetX = this.scene.position.x + offsetToCenter + this.offsetX;
    }

    if (this.followY) {
      const offsetToCenter = this.stage.height / 2 - worldCenter.y;
      this._targetY = this.scene.position.y + offsetToCenter + this.offsetY;
    }
  }

  override onCreate(): void {
    // 初始化摄像机位置为当前场景位置
    if (this.target?.scene) {
      this._currentX = this.target.scene.position.x;
      this._currentY = this.target.scene.position.y;
    }
  }

  override onAwake(): void {
    // 如果设置了跟随目标，立即同步到目标位置
    if (this._followTarget) {
      this.snapToTarget();
    }
  }

  override onUpdate(delta: number): void {
    if (!this._followTarget) return;

    // 更新目标位置
    this._calculateTargetPosition(this._followTarget);

    // 应用边界约束
    this._applyBoundsConstraint();

    // 应用平滑缓动
    this._applySmoothMovement(delta);

    // 更新场景位置
    this._applyCameraPosition();
  }

  private _applyBoundsConstraint(): void {
    if (!this._sceneBounds) return;

    const { left, right, top, bottom } = this._sceneBounds;

    if (this.followX) {
      this._targetX = Math.max(left, Math.min(right, this._targetX));
    }

    if (this.followY) {
      this._targetY = Math.max(top, Math.min(bottom, this._targetY));
    }
  }

  private _applySmoothMovement(delta: number): void {
    if (this.smoothness <= 0) {
      // 无缓动，直接到达目标位置
      if (this.followX) this._currentX = this._targetX;
      if (this.followY) this._currentY = this._targetY;
      return;
    }

    // 计算基于帧率的缓动因子
    // 使用16ms作为基准帧时间（60fps），确保在不同帧率下缓动效果一致
    const frameFactor = Math.min(1, this.smoothness * (delta / 0.016));

    if (this.followX) {
      this._currentX += (this._targetX - this._currentX) * frameFactor;
    }

    if (this.followY) {
      this._currentY += (this._targetY - this._currentY) * frameFactor;
    }
  }

  private _applyCameraPosition(): void {
    if (!this.scene) return;

    if (this.followX) {
      this.scene.position.x = this._currentX;
    }

    if (this.followY) {
      this.scene.position.y = this._currentY;
    }
  }

  /**
   * 获取当前摄像机位置
   */
  getCurrentPosition(): { x: number; y: number } {
    return {
      x: this._currentX,
      y: this._currentY,
    };
  }

  /**
   * 获取摄像机目标位置
   */
  getTargetPosition(): { x: number; y: number } {
    return {
      x: this._targetX,
      y: this._targetY,
    };
  }

  /**
   * 检查摄像机是否已到达目标位置
   *
   * @param threshold 判定阈值（像素），默认1像素
   * @returns 是否已到达目标位置
   */
  isAtTarget(threshold = 1): boolean {
    const deltaX = Math.abs(this._currentX - this._targetX);
    const deltaY = Math.abs(this._currentY - this._targetY);
    return deltaX < threshold && deltaY < threshold;
  }

  /**
   * 停止跟随并清理资源
   */
  stopFollowing(): void {
    this._followTarget = undefined;
  }

  override onDestroy(): void {
    this.stopFollowing();
    this.bounds = undefined;
  }
}
