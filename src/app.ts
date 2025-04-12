import { KeyBoardManager } from "./events/keyboard-manager";
import { MouseManager } from "./events/mouse-manager";
import { Stage } from "./nodes/stage";
import { createPhysics, type PhysicsOptions } from "./physics";
import { Device, initDevice } from "./render/device/device";
import { Renderer } from "./render/renderer";
import type { ColorData } from "./utils/color";
import { Timer } from "./utils/timer";

const defaultOptions = {
  width: innerWidth,
  height: innerHeight,
  bgColor: 0xff0000,
  pixelRatio: window.devicePixelRatio,
};

export interface IAppOptions {
  width?: number;
  height?: number;
  bgColor?: ColorData;
  container?: string;
  canvas?: HTMLCanvasElement;
  pixelRatio?: number;
  autoResize?: boolean;
  physics?: PhysicsOptions;
}

/**
 * 通过 init 进行启动引擎，所有操作要等到启动之后再进行
 */
export class App {
  private _frameHandle = 0;
  private _renderHandler = this.render.bind(this);

  /** 显示的像素比 */
  static pixelRatio = window.devicePixelRatio;

  /** 渲染器 */
  renderer: Renderer = new Renderer();
  /** 舞台，渲染的根节点 */
  stage = new Stage();

  /**
   * 启动引擎
   * @param options 引擎参数
   * @returns 返回画布
   */
  async init(options?: IAppOptions) {
    initDevice();
    const canvas = options?.canvas ?? Device.createCanvas();
    const params = { canvas, ...defaultOptions, ...options };
    App.pixelRatio = params.pixelRatio;

    this.stage.canvas = canvas;
    this.stage.renderer = this.renderer;
    this.stage.keyboard = new KeyBoardManager(this.stage);
    this.stage.mouse = new MouseManager(this.stage);

    if (!canvas.parentNode) {
      const container = params.container ? document.getElementById(params.container) : document.body;
      if (container) container.appendChild(canvas);
      else throw new Error(`cant not find canvas's container:${params.container}`);
    }

    await this.renderer.init(params);
    this.stage.resize(params.width, params.height);

    // 根据 canvas 父对象，重置画布大小
    if (params.autoResize) {
      window.onresize = () => {
        const container = canvas.parentElement!;
        const containerBounds = container.getBoundingClientRect();
        this.stage.resize(containerBounds.width, containerBounds.height);
      };
    }

    if (params.physics) {
      const physics = await createPhysics();
      physics.init({ timer: this.stage.timer, ...params.physics });
    }

    this.start();

    return canvas;
  }

  /**
   * 开始播放引擎
   */
  start() {
    this._frameHandle = requestAnimationFrame(this._renderHandler);
  }

  /**
   * 停止播放引擎
   */
  stop() {
    cancelAnimationFrame(this._frameHandle);
  }

  /**
   * 渲染引擎
   */
  render(time: number) {
    // 先执行call later
    if (Timer.callLaterList.length > 0) {
      for (let i = 0; i < Timer.callLaterList.length; i++) {
        Timer.callLaterList[i].run();
      }
      Timer.callLaterList.length = 0;
    }
    // 再执行渲染
    this.renderer.render(this.stage);
    // 再执行timer
    const second = time * 0.001;
    // TODO：多个 app 实例，这里会被多次 update，会有问题
    Timer.system.update(second);
    // 执行 stage timer
    this.stage.timer.update(second);

    this._frameHandle = requestAnimationFrame(this._renderHandler);
  }

  /**
   * 销毁引擎
   */
  destroy() {
    this._renderHandler = () => {};
    this.stage.destroy();
    this.renderer.destroy();
  }
}
