import { KeyBoardManager } from './events/keyboard-manager';
import { PointerManager } from './events/pointer-manager';
import { Stage } from './nodes/stage';
import { type PhysicsOptions, createPhysics } from './physics';
import { initDevice } from './render/device/device';
import { Renderer } from './render/renderer';
import type { ColorData } from './utils/color';
import { Timer } from './utils/timer';
import { createCanvas } from './utils/utils';

/** 引擎默认配置选项 */
const defaultOptions = {
  width: innerWidth,
  height: innerHeight,
  bgColor: 0x000000,
  pixelRatio: window.devicePixelRatio,
};

/** 引擎初始化选项接口 */
export interface IAppOptions {
  /** 应用标题 */
  title?: string;
  /** 画布宽度（逻辑像素），必须为正数 */
  width?: number;
  /** 画布高度（逻辑像素），必须为正数 */
  height?: number;
  /** 背景颜色 */
  bgColor?: ColorData;
  /** 画布容器 ID 或者 DOM 元素，用来添加画布到指定容器中，如果提供则必须存在于 DOM 中 */
  container?: string | HTMLElement;
  /** 自定义画布元素 */
  canvas?: HTMLCanvasElement;
  /** 设备像素比 */
  pixelRatio?: number;
  /** 是否自动调整大小以适应画布容器 */
  autoResize?: boolean;
  /** 物理引擎选项 */
  physics?: PhysicsOptions;
}

/**
 * 引擎应用类，负责初始化和管理引擎生命周期
 *
 * 这是整个引擎的入口类，提供了渲染、事件管理、物理引擎等功能的统一接口。
 * 通过 init 方法启动引擎，所有操作需要在启动完成后进行。
 *
 * @example
 * ```typescript
 * // 基本使用
 * const app = new App();
 * await app.init({
 *   width: 800,
 *   height: 600,
 *   container: 'game-container'
 * });
 *
 * // 添加游戏对象到舞台
 * const sprite = new Sprite();
 * app.stage.addChild(sprite);
 *
 * // 控制渲染循环
 * app.pause();  // 暂停渲染
 * app.resume(); // 恢复渲染
 *
 * // 销毁引擎
 * app.destroy();
 * ```
 *
 * @注意事项
 * - 所有操作必须在 init 方法完成后进行
 * - 销毁后的引擎实例不可重用，需要重新创建新实例
 */
export class App {
  /**
   * 全局设备像素比，影响所有 App 实例的渲染分辨率
   * @remarks 该值会在 init 方法中根据配置进行更新
   */
  static pixelRatio = window.devicePixelRatio;

  private _frameHandle = 0;
  private _renderHandler = this.render.bind(this);

  /**
   * 渲染器实例，负责实际的图形渲染工作
   */
  readonly renderer: Renderer = new Renderer();

  /**
   * 舞台实例，作为所有显示对象的根容器
   */
  readonly stage = new Stage();

  constructor() {
    initDevice();
  }

  /**
   * 初始化并启动引擎
   * @param options - 引擎初始化选项，可选
   * @returns 返回创建或使用的画布元素
   * @remarks
   * - 该方法必须在使用引擎的其他功能前调用
   * - 如果未提供 canvas，会自动创建一个新的画布元素
   * - 如果未提供 container，画布会添加到 document.body 中
   * - 启用物理引擎需要在 options.physics 中设置 enabled: true
   */
  async init(options?: IAppOptions) {
    const canvas = options?.canvas ?? createCanvas();
    const params = { canvas, ...defaultOptions, ...options };
    App.pixelRatio = params.pixelRatio;

    this.stage.canvas = canvas;
    this.stage.renderer = this.renderer;
    this.stage.keyboard = new KeyBoardManager(this.stage);
    this.stage.pointer = new PointerManager(this.stage);

    if (!canvas.parentNode) {
      const container =
        typeof params.container === 'string'
          ? document.getElementById(params.container)
          : (params.container ?? document.body);
      if (container) container.appendChild(canvas);
      else throw new Error(`cant not find canvas's container:${params.container}`);
    }

    await this.renderer.init(params);
    this.stage.resize(params.width, params.height);

    // 根据 canvas 父元素，自动调整画布大小
    if (params.autoResize) {
      window.onresize = () => {
        this.stage.autoResize();
      };
      this.stage.autoResize();
    }

    if (params.physics?.enabled) {
      const physics = await createPhysics();
      physics.init({ timer: this.stage.timer, ...params.physics });
    }

    // 开始渲染循环
    this._frameHandle = requestAnimationFrame(this._renderHandler);

    return canvas;
  }

  /**
   * 暂停引擎的渲染循环
   * @remarks
   * - 暂停后所有动画和渲染都会停止
   * - 可以通过 resume 方法恢复渲染
   * - 暂停期间事件处理仍然正常工作
   */
  pause() {
    cancelAnimationFrame(this._frameHandle);
  }

  /**
   * 恢复引擎的渲染循环
   * @remarks
   * - 只有在调用 pause 方法后才需要使用此方法
   * - 恢复后引擎会继续正常的渲染循环
   */
  resume() {
    this._frameHandle = requestAnimationFrame(this._renderHandler);
  }

  /**
   * 引擎的核心渲染循环方法
   * @param time - 当前时间戳（毫秒）
   * @remarks
   * - 该方法通常由引擎内部自动调用，不建议手动调用
   */
  render(time: number) {
    // 先执行延迟调用队列
    Timer.runAllCallLater();

    // 执行场景渲染
    this.renderer.render(this.stage);

    // 计算当前时间（秒）
    const second = time * 0.001;

    // TODO：多个 app 实例，这里会被多次 update，会有问题
    // 更新系统计时器
    Timer.system.update(second);

    // 更新舞台计时器
    this.stage.timer.update(second);

    // 请求下一帧渲染
    this._frameHandle = requestAnimationFrame(this._renderHandler);
  }

  /**
   * 销毁引擎实例及其所有资源
   * @remarks
   * - 销毁后引擎将完全停止工作，无法恢复
   * - 会清理所有相关资源，包括画布、事件监听器等
   * - 销毁后的实例不可重用，如需继续使用需创建新的实例
   * - 建议在页面卸载或不再需要引擎时调用此方法
   */
  destroy() {
    cancelAnimationFrame(this._frameHandle);
    this._renderHandler = () => {};
    this.stage.destroy();
    this.renderer.destroy();
  }
}
