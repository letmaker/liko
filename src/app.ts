import { KeyBoardManager } from "./events/keyboard-manager";
import { PointerManager } from "./events/pointer-manager";
import { Stage } from "./nodes/stage";
import { type PhysicsOptions, createPhysics } from "./physics";
import { Device, initDevice } from "./render/device/device";
import { Renderer } from "./render/renderer";
import type { ColorData } from "./utils/color";
import { Timer } from "./utils/timer";

/** 引擎默认配置选项 */
const defaultOptions = {
  width: innerWidth,
  height: innerHeight,
  bgColor: 0x000000,
  pixelRatio: window.devicePixelRatio,
};

/** 引擎初始化选项接口 */
export interface IAppOptions {
  /** 画布宽度（逻辑像素），必须为正数 */
  width?: number;
  /** 画布高度（逻辑像素），必须为正数 */
  height?: number;
  /** 背景颜色 */
  bgColor?: ColorData;
  /** 画布容器 ID，如果提供则必须存在于 DOM 中 */
  container?: string;
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
 * 通过 init 方法启动引擎，所有操作需要在启动完成后进行
 */
export class App {
  /** 显示的设备像素比 */
  static pixelRatio = window.devicePixelRatio;

  private _frameHandle = 0;
  private _renderHandler = this.render.bind(this);

  /** 渲染器实例 */
  renderer: Renderer = new Renderer();
  /** 舞台实例，作为渲染的根节点 */
  stage = new Stage();

  /**
   * 初始化并启动引擎
   * @param options - 引擎初始化选项
   * @returns 返回创建或使用的画布元素
   */
  async init(options?: IAppOptions) {
    initDevice();
    const canvas = options?.canvas ?? Device.createCanvas();
    const params = { canvas, ...defaultOptions, ...options };
    App.pixelRatio = params.pixelRatio;

    this.stage.canvas = canvas;
    this.stage.renderer = this.renderer;
    this.stage.keyboard = new KeyBoardManager(this.stage);
    this.stage.pointer = new PointerManager(this.stage);

    if (!canvas.parentNode) {
      const container = params.container ? document.getElementById(params.container) : document.body;
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

    if (params.physics) {
      const physics = await createPhysics();
      physics.init({ timer: this.stage.timer, ...params.physics });
    }

    // 开始渲染循环
    this._frameHandle = requestAnimationFrame(this._renderHandler);

    return canvas;
  }

  /**
   * 暂停引擎循环，暂停后可通过 resume 方法恢复
   */
  pause() {
    cancelAnimationFrame(this._frameHandle);
  }

  /**
   * 恢复引擎循环，在调用 pause 方法后使用此方法恢复渲染
   */
  resume() {
    this._frameHandle = requestAnimationFrame(this._renderHandler);
  }

  /**
   * 执行引擎渲染循环
   * @param time - 当前时间戳（毫秒）
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
   * 销毁引擎实例及其所有资源，销毁后引擎将不再可用，需要重新初始化
   */
  destroy() {
    cancelAnimationFrame(this._frameHandle);
    this._renderHandler = () => {};
    this.stage.destroy();
    this.renderer.destroy();
  }
}
