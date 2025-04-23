import { App } from "../app";
import type { KeyBoardManager } from "../events/keyboard-manager";
import type { PointerManager } from "../events/pointer-manager";
import type { Bounds } from "../math/bounds";
import type { IPoint } from "../math/point";
import type { Renderer } from "../render/renderer";
import { Store } from "../utils/store";
import { Timer } from "../utils/timer";
import { type INodeData, LikoNode } from "./node";
import { Scene } from "./scene";

/**
 * 舞台类，作为渲染的根节点，管理场景和输入事件
 */
export class Stage extends LikoNode {
  /** 场景时间轴，驱动场景动画，可以用于控制动画的播放速度 */
  timer = new Timer();
  /** 全局数据存储 */
  store = new Store();
  /** 渲染使用的主画布 */
  canvas!: HTMLCanvasElement;
  /** 图形渲染器 */
  renderer!: Renderer;
  /** 键盘输入管理器 */
  keyboard!: KeyBoardManager;
  /** 指针（鼠标/触摸）输入管理器 */
  pointer!: PointerManager;

  constructor() {
    super();
    this.pp.stage = this;
    this.pointerEnabled = true;
    this.label = "Stage";
  }

  /**
   * 重设舞台大小
   * @param width 舞台宽度（逻辑像素）
   * @param height 舞台高度（逻辑像素）
   */
  resize(width: number, height: number) {
    const newWidth = Math.round(width);
    const newHeight = Math.round(height);
    if (newWidth === this.width && newHeight === this.height) {
      return;
    }

    this.width = newWidth;
    this.height = newHeight;
    if (App.pixelRatio !== 1) {
      this.canvas.width = newWidth * App.pixelRatio;
      this.canvas.height = newHeight * App.pixelRatio;
      this.canvas.style.cssText = `width: ${newWidth}px; height: ${newHeight}px; `;
    } else {
      this.canvas.width = newWidth;
      this.canvas.height = newHeight;
    }

    this.renderer.resize(newWidth, newHeight);
    this.pp.localBounds.set(0, 0, newWidth, newHeight);
  }

  /**
   * 获取舞台的本地边界
   * @returns 舞台边界对象
   */
  override getLocalBounds(): Bounds {
    return this.pp.localBounds;
  }

  /**
   * 检测指定点是否在舞台范围内
   * @param point 要检测的点坐标
   * @returns 如果点在舞台内返回 true，否则返回 false
   */
  override hitTest(point: IPoint) {
    return this.getLocalBounds().contains(point.x, point.y);
  }

  /**
   * 从指定 URL 加载场景
   * @param url 场景资源的 URL
   * @param options 加载选项
   * @param options.destroyOther 是否销毁其他场景
   * @param options.preloadAllAssets 是否预加载所有资源
   * @returns 加载完成的场景实例
   */
  async loadScene(url: string, options?: { destroyOther: boolean; preloadAllAssets: boolean }) {
    const scene = new Scene();
    await scene.load(url, options?.preloadAllAssets);
    if (options?.destroyOther) {
      this.destroyChildren();
    }
    this.addChild(scene);
    return scene;
  }

  /**
   * 从 JSON 数据创建场景
   * @param json 场景的 JSON 数据
   * @param options 创建选项
   * @param options.destroyOther 是否销毁其他场景
   * @param options.preloadAllAssets 是否预加载所有资源
   * @returns 创建的场景实例
   */
  async createScene(json: INodeData, options?: { destroyOther: boolean; preloadAllAssets: boolean }) {
    const scene = new Scene();
    if (options?.preloadAllAssets) {
      await scene.preloadAllAssets(json);
    }
    scene.fromJson(json);
    if (options?.destroyOther) {
      this.destroyChildren();
    }
    this.addChild(scene);
    return scene;
  }

  /**
   * 暂停舞台的动画和计时器
   */
  pause() {
    this.timer.pause();
  }

  /**
   * 恢复舞台的动画和计时器
   */
  resume() {
    this.timer.resume();
  }

  /**
   * 销毁 Stage 实例及其所有资源，包括计时器、数据存储、渲染器和输入管理器
   */
  override destroy(): void {
    if (!this.destroyed) {
      this.timer.destroy();
      this.store.destroy();
      this.renderer.destroy();
      this.keyboard.destroy();
      this.pointer.destroy();
      super.destroy();
    }
  }
}
