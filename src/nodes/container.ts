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
}
