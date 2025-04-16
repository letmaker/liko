import type { Bounds } from "../math/bounds";
import { RegNode } from "../utils/decorators";
import { Node } from "./node";

/**
 * 容器类
 */
@RegNode("Container")
export class Container extends Node {
  override hitTest() {
    return false;
  }

  protected override _customLocalBounds(bounds: Bounds): void {
    // 计算子节点的 bounds
    for (const child of this.children) {
      const { pos } = child;
      if (child.rotation) {
        bounds.addFrame(0, 0, child.width, child.height);
        bounds.addFrame(0, child.height, child.width, 0);
        bounds.applyMatrix(child.localMatrix);
      } else {
        bounds.addFrame(pos.x, pos.y, pos.x + child.width, pos.y + child.height);
      }
    }
  }
}
