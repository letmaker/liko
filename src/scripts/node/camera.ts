import type { Rectangle } from '../../math/rectangle';
import type { LikoNode } from '../../nodes/node';
import { BaseScript } from '../base-script';

/**
 * 摄像机脚本，用于实现摄像机跟随功能
 *
 * @remarks
 * 功能特性：
 * - 支持目标跟随
 * - 支持缓动跟随，平滑过渡
 * - 支持边界约束，防止摄像机超出指定范围
 * - 支持位置偏移
 * - 自动处理场景和目标的位置关系
 */
export class Camera extends BaseScript {
  /** 跟随的目标节点 */
  followTarget?: LikoNode;

  /** 缓动系数，值越大跟随越快 (0-1)，默认为0.1 */
  easing = 0.1;

  /** 摄像机边界约束 */
  bounds?: Rectangle;

  /** 是否启用跟随功能 */
  followEnabled = true;

  /** X轴偏移量 */
  offsetX = 0;

  /** Y轴偏移量 */
  offsetY = 0;

  private _targetX = 0;
  private _targetY = 0;
  private _currentX = 0;
  private _currentY = 0;

  /**
   * 设置跟随目标
   * @param target - 要跟随的目标节点
   */
  setTarget(target: LikoNode): void {
    this.followTarget = target;
    if (target) {
      // 立即同步到目标位置
      this.snapToTarget();
    }
  }

  /**
   * 设置边界约束
   * @param bounds - 边界约束配置
   */
  setBounds(bounds: Rectangle): void {
    this.bounds = bounds;
  }

  /**
   * 立即移动到目标位置（无缓动）
   */
  snapToTarget(): void {
    if (!this.followTarget) return;

    this._targetX = this.followTarget.position.x + this.offsetX;
    this._targetY = this.followTarget.position.y + this.offsetY;
    this._currentX = this._targetX;
    this._currentY = this._targetY;
    this._updateScenePosition();
  }

  /**
   * 手动设置摄像机位置
   * @param x - X坐标
   * @param y - Y坐标
   * @param snap - 是否立即移动到目标位置
   */
  setPosition(x: number, y: number, snap = false): void {
    this._targetX = x;
    this._targetY = y;

    if (snap) {
      this._currentX = this._targetX;
      this._currentY = this._targetY;
      this._updateScenePosition();
    }
  }

  override onCreate(): void {
    // 初始化摄像机位置
    if (this.target?.scene) {
      this._currentX = this.target.scene.position.x;
      this._currentY = this.target.scene.position.y;
    }
  }

  override onAwake(): void {
    // 如果有跟随目标，立即同步位置
    if (this.followTarget) {
      this.snapToTarget();
    }
  }

  override onUpdate(delta: number): void {
    if (!this.followTarget) return;

    // 更新目标位置
    if (this.followTarget) {
      this._targetX = this.followTarget.position.x + this.offsetX;
      this._targetY = this.followTarget.position.y + this.offsetY;
    }

    // 应用边界约束
    this._applyBounds();

    // 缓动插值
    if (this.easing > 0) {
      const factor = Math.min(1, this.easing * (delta / 16)); // 基于16ms标准帧时间
      this._currentX += (this._targetX - this._currentX) * factor;
      this._currentY += (this._targetY - this._currentY) * factor;
    } else {
      this._currentX = this._targetX;
      this._currentY = this._targetY;
    }

    // 更新场景位置
    this._updateScenePosition();
  }

  /**
   * 应用边界约束
   */
  private _applyBounds(): void {
    if (!this.bounds) return;

    const { left, right, top, bottom } = this.bounds;

    if (this._targetX < left) {
      this._targetX = left;
    }
    if (this._targetX > right) {
      this._targetX = right;
    }
    if (this._targetY < top) {
      this._targetY = top;
    }
    if (this._targetY > bottom) {
      this._targetY = bottom;
    }
  }

  /**
   * 更新场景位置，实现摄像机效果
   */
  private _updateScenePosition(): void {
    // 摄像机的位置与场景位置相反，实现跟随效果
    this.scene?.position.set(-this._currentX, -this._currentY);
  }

  /**
   * 获取当前摄像机位置
   */
  getPosition(): { x: number; y: number } {
    return {
      x: this._currentX,
      y: this._currentY,
    };
  }

  /**
   * 获取目标位置
   */
  getTargetPosition(): { x: number; y: number } {
    return {
      x: this._targetX,
      y: this._targetY,
    };
  }

  /**
   * 检查是否到达目标位置
   * @param threshold - 距离阈值，默认为1像素
   */
  isAtTarget(threshold = 1): boolean {
    const dx = Math.abs(this._currentX - this._targetX);
    const dy = Math.abs(this._currentY - this._targetY);
    return dx < threshold && dy < threshold;
  }

  override onDestroy(): void {
    this.followTarget = undefined;
    this.bounds = undefined;
  }
}
