import type { Bounds } from '../math/bounds';
import { RegNode } from '../utils/decorators';
import { LikoNode } from './node';

/**
 * 容器节点类，用于包含和管理多个子节点
 *
 * Container是一个特殊的节点类型，主要用于组织和管理其他节点的层次结构。
 * 容器本身不具备视觉表现，主要作为其他节点的父容器存在。
 *
 * @example
 * ```typescript
 * // 创建一个容器
 * const container = new Container();
 *
 * // 添加子节点到容器中
 * const sprite1 = new Sprite('image1.png');
 * const sprite2 = new Sprite('image2.png');
 * container.addChild(sprite1);
 * container.addChild(sprite2);
 *
 * // 设置容器位置，所有子节点会跟随移动
 * container.position.set(100, 100);
 *
 * // 设置容器缩放，所有子节点会跟随缩放
 * container.scale.set(2, 2);
 * ```
 *
 * @注意事项
 * - 容器本身不可点击（hitTest始终返回false），点击事件会穿透到子节点
 * - 容器的边界会自动根据所有子节点的边界计算得出
 * - 对容器的变换（位置、旋转、缩放）会影响所有子节点
 */
@RegNode('Container')
export class Container extends LikoNode {
  /**
   * 重写命中测试方法
   * 容器本身不参与点击检测，始终返回false让点击事件穿透到子节点
   * @returns 始终返回 false，表示容器本身不可点击
   */
  override hitTest(): boolean {
    return false;
  }

  /**
   * 遍历所有子节点，计算它们的边界并合并到当前容器的边界中
   */
  protected override _customLocalBounds(bounds: Bounds): void {
    for (const child of this.children) {
      const { position } = child;
      if (child.rotation) {
        // 对于旋转的节点，需要添加矩形的四个顶点并应用变换矩阵
        bounds.addFrame(0, 0, child.width, child.height);
        // TODO 是否需要
        // bounds.addFrame(0, child.height, child.width, 0);
        bounds.applyMatrix(child.localMatrix);
      } else {
        // 对于未旋转的节点，直接添加其边界框
        bounds.addFrame(position.x, position.y, position.x + child.width, position.y + child.height);
      }
    }
  }
}
