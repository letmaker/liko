import type { Bounds } from "../math/bounds";
import { RegNode } from "../utils/decorators";
import { LikoNode } from "./node";

/**
 * 容器节点类，用于包含和管理多个子节点
 */
@RegNode("Container")
export class Container extends LikoNode {
  /**
   * 重写命中测试方法
   * @returns 始终返回 false，表示容器本身不可点击
   */
  override hitTest(): boolean {
    return false;
  }

  protected override _customLocalBounds(bounds: Bounds): void {
    for (const child of this.children) {
      const { position } = child;
      if (child.rotation) {
        // 对于旋转的节点，需要添加矩形的四个顶点并应用变换矩阵
        bounds.addFrame(0, 0, child.width, child.height);
        bounds.addFrame(0, child.height, child.width, 0);
        bounds.applyMatrix(child.localMatrix);
      } else {
        // 对于未旋转的节点，直接添加其边界框
        bounds.addFrame(position.x, position.y, position.x + child.width, position.y + child.height);
      }
    }
  }
}
