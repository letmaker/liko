import { App } from "../app";
import type { KeyBoardManager } from "../events/keyboard-manager";
import type { MouseManager } from "../events/mouse-manager";
import type { IPoint } from "../math/point";
import type { Renderer } from "../render/renderer";
import { Store } from "../utils/store";
import { Timer } from "../utils/timer";
import { Node } from "./node";

export class Stage extends Node {
  /** 场景时间轴，可以用来做加速及减速 */
  timer = new Timer();
  /** 全局数据仓库 */
  store = new Store();
  /** 渲染主画布 */
  canvas!: HTMLCanvasElement;
  /** 渲染器 */
  renderer!: Renderer;
  /** 键盘管理器 */
  keyboard!: KeyBoardManager;
  /** 鼠标管理器 */
  mouse!: MouseManager;

  constructor() {
    super();
    this.pp.stage = this;
    this.mouseEnable = true;
  }

  destroy(): void {
    if (!this.destroyed) {
      this.timer.destroy();
      this.store.destroy();
      this.renderer.destroy();
      this.keyboard.destroy();
      this.mouse.destroy();
      super.destroy();
    }
  }

  /**
   * 重设 stage 大小
   */
  resize(width: number, height: number) {
    if (App.pixelRatio !== 1) {
      const newWidth = width * App.pixelRatio;
      const newHeight = height * App.pixelRatio;
      this.width = newWidth;
      this.height = newHeight;
      this.canvas.width = newWidth;
      this.canvas.height = newHeight;
      this.canvas.style.cssText = `width: ${width}px; height: ${height}px; `;
    } else {
      this.width = width;
      this.height = height;
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.renderer.resize(width, height);
  }

  /**
   * 某个点是否在节点内部
   * @param point 节点位置
   * @returns 是否在节点内部
   */
  override hitTest(point: IPoint) {
    const bounds = this.getLocalBounds();
    return bounds.contains(point.x, point.y);
  }
}
