import { RegNode } from "../utils/decorators";
import { Animation, type IAnimation } from "./animation";

export type IScene = IAnimation;

/**
 * 所有动画、脚本、动效均由所在的场景统一驱动
 */
@RegNode("Scene")
export class Scene extends Animation implements IScene {
  override get root(): Scene {
    return this;
  }

  override get scene(): Scene {
    return this;
  }
}
