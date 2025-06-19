import { App } from '../app';
import type { KeyBoardManager } from '../events/keyboard-manager';
import type { PointerManager } from '../events/pointer-manager';
import type { Bounds } from '../math/bounds';
import type { IPoint } from '../math/point';
import type { Renderer } from '../render/renderer';
import { Store } from '../utils/store';
import { Timer } from '../utils/timer';
import { type INodeData, LikoNode } from './node';
import { Scene } from './scene';

/**
 * 舞台类，作为整个渲染系统的根节点，负责管理场景、输入事件、渲染流程和全局状态
 *
 * Stage 是整个 Liko 引擎的核心容器，承担以下职责：
 * - 管理HTML画布和图形渲染器
 * - 处理用户输入（键盘、鼠标、触摸）
 * - 控制场景的加载、创建和切换
 * - 驱动动画时间轴和帧更新
 * - 提供全局数据存储服务
 * - 处理舞台尺寸变化和自适应
 *
 * @example
 * ```typescript
 * // 基本使用示例
 * const app = new App();
 * // 初始化并挂载到DOM
 * await app.init({
 *   container: document.getElementById('game-container'),
 *   width: 800,
 *   height: 600,
 *   backgroundColor: 'black'
 * });
 *
 * // 加载场景
 * const scene = await app.stage.loadScene('assets/scenes/main.json', {
 *   destroyOther: true,
 *   preloadAssets: true
 * });
 *
 * // 或者从数据创建场景
 * const sceneData = { type: 'Scene', children: [...] };
 * const scene2 = await app.stage.createScene(sceneData, {
 *   destroyOther: false
 * });
 *
 * // 监听输入事件
 * app.stage.keyboard.on(EventType.keydown, (e) => {
 *   if (e.key === 'Space') {
 *     scene.someCharacter.jump();
 *   }
 * });
 *
 * app.stage.pointer.on(EventType.click, (e) => {
 *   const hitNode = app.stage.hitTest(e.pointer);
 *   if (hitNode) {
 *     hitNode.onClick?.(e);
 *   }
 * });
 *
 * // 使用全局存储
 * app.stage.store.set('playerScore', 100);
 * app.stage.store.set('gameSettings', { sound: true, music: false });
 *
 * // 控制动画播放
 * app.stage.pause(); // 暂停所有场景动画
 * app.stage.resume(); // 恢复所有场景动画
 * ```
 *
 * @注意事项
 * - 必须通过 app.init() 来正确初始化 Stage，不要直接使用构造函数创建后就使用
 * - Stage 的尺寸变化会触发整个渲染树的重新布局，频繁调用 resize 可能影响性能
 * - 场景切换时建议使用 destroyOther 选项来释放内存，避免内存泄漏
 * - Timer 是全局的，暂停 stage 会影响所有子节点的动画和定时器
 * - 使用 store 存储的数据在 stage 销毁时会被清理，如需持久化请另行处理
 */
export class Stage extends LikoNode {
  /**
   * 舞台时间轴，驱动整个舞台及所有场景的动画系统
   * 可以通过调整时间轴的播放速度来实现慢镜头、快进等效果
   * 暂停时间轴会停止所有基于时间的动画和Tween
   */
  timer = new Timer();

  /**
   * 全局数据存储，提供键值对存储服务
   * 适用于存储游戏状态、用户设置、临时数据等
   * 支持任意类型的数据存储和事件监听
   */
  store = new Store();

  /**
   * 渲染使用的主画布元素
   * 由 App 在初始化时创建并挂载到DOM
   * 不应该手动修改此属性
   */
  canvas!: HTMLCanvasElement;

  /**
   * 图形渲染器，负责将节点树渲染到画布上
   */
  renderer!: Renderer;

  /**
   * 键盘输入管理器，处理所有键盘相关的事件
   * 提供按键状态查询、组合键检测、事件监听等功能
   */
  keyboard!: KeyBoardManager;

  /**
   * 指针输入管理器，统一处理鼠标和触摸事件
   */
  pointer!: PointerManager;

  constructor() {
    super();
    this.pp.stage = this;
    this.pointerEnabled = true;
    this.pointerEnabledForChildren = true;
    this.label = 'Stage';
  }

  /**
   * 自动调整舞台大小以适应父容器
   * 获取画布父元素的尺寸并据此调整舞台大小
   * 适用于响应式布局和窗口大小变化的场景
   */
  autoResize() {
    const container = this.canvas.parentElement;
    if (container) {
      const containerBounds = container.getBoundingClientRect();
      this.resize(containerBounds.width, containerBounds.height);
    }
  }

  /**
   * 重设舞台大小
   * 会同步更新画布尺寸、渲染器视窗和本地边界
   * 如果新尺寸与当前尺寸相同，则不执行任何操作以提高性能
   *
   * @param width - 舞台宽度（逻辑像素），会被四舍五入为整数
   * @param height - 舞台高度（逻辑像素），会被四舍五入为整数
   * @returns 返回 this 引用，支持链式调用
   */
  resize(width: number, height: number): this {
    const newWidth = Math.round(width);
    const newHeight = Math.round(height);
    if (newWidth === this.width && newHeight === this.height) {
      return this;
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

    return this;
  }

  /**
   * 获取舞台的本地边界矩形
   * 舞台的本地边界始终从 (0,0) 开始，到 (width, height) 结束
   */
  override getLocalBounds(): Bounds {
    return this.pp.localBounds;
  }

  /**
   * 检测指定点是否在舞台可视范围内
   * 主要用于指针事件的边界检测和碰撞检测
   *
   * @param point - 要检测的点坐标（相对于舞台的本地坐标系）
   * @returns 如果点在舞台内返回 true，否则返回 false
   */
  override hitTest(point: IPoint): boolean {
    return this.getLocalBounds().contains(point.x, point.y);
  }

  /**
   * 从指定 URL 异步加载场景资源
   * 支持 JSON 格式的场景文件，可选择是否预加载相关资源
   * 加载完成后会自动将场景添加为 Stage 的子节点
   *
   * @param url - 场景资源的 URL 地址，支持相对路径和绝对路径
   * @param options - 加载选项配置
   * @param options.destroyOther - 是否在加载新场景前销毁现有的所有子场景，默认为 false
   * @param options.preloadAssets - 是否预加载场景中引用的所有资源（图片、音频等），默认为 false
   */
  async loadScene(url: string, options?: { destroyOther?: boolean; preloadAssets?: boolean }) {
    const scene = new Scene();
    await scene.load(url, options?.preloadAssets);
    if (options?.destroyOther) {
      this.destroyChildren();
    }
    this.addChild(scene);
    return scene;
  }

  /**
   * 从 JSON 数据对象创建场景
   * 直接使用内存中的数据创建场景，无需网络请求
   * 适用于动态生成的场景或已缓存的场景数据
   *
   * @param json - 符合 INodeData 格式的场景 JSON 数据对象
   * @param options - 创建选项配置
   * @param options.destroyOther - 是否在创建新场景前销毁现有的所有子场景，默认为 false
   * @param options.preloadAssets - 是否预加载场景中引用的所有资源，默认为 false
   */
  async createScene(json: INodeData, options?: { destroyOther?: boolean; preloadAssets?: boolean }) {
    const scene = new Scene();
    if (options?.preloadAssets) {
      await scene.preloadAssets(json);
    }
    scene.fromJson(json);
    if (options?.destroyOther) {
      this.destroyChildren();
    }
    this.addChild(scene);
    return scene;
  }

  /**
   * 暂停舞台的动画时间轴
   * 会停止所有场景动画和基于 Timer 的动画、Tween 和定时任务
   * 不影响非 Timer 驱动的交互和渲染，如指针事件、键盘事件等
   *
   * @returns 返回 this 引用，支持链式调用
   */
  pause(): this {
    this.timer.pause();
    return this;
  }

  /**
   * 恢复舞台的动画时间轴
   * 重新启动之前被暂停的场景动画和基于 Timer 的动画、Tween 和定时任务
   * 时间轴会从暂停的位置继续，不会跳过暂停期间的时间
   * 不影响非 Timer 驱动的交互和渲染，如指针事件、键盘事件等
   *
   * @returns 返回 this 引用，支持链式调用
   */
  resume(): this {
    this.timer.resume();
    return this;
  }

  /**
   * 销毁 Stage 实例及其所有关联资源
   * 会依次销毁计时器、数据存储、渲染器、输入管理器和所有子节点
   * 销毁后的 Stage 实例不可再使用，任何操作都可能导致错误
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
