import { EventType } from "../const";
import { loader } from "../loader";
import { Controller } from "../scripts/controller/controller";
import { RegNode } from "../utils/decorators";
import { Register } from "../utils/register";
import { getUID } from "../utils/utils";
import type { INodeData, INodeOptions } from "./node";
import { type INodePrivateProps, Node } from "./node";

/** 动画接口，所有实现此接口的动画，都可以在编辑器内对动画进行控制 */
export interface IAnimation extends Node {
  /** 动画持续时长 */
  duration: number;
  controller?: Controller;
  play: () => void;
  stop: () => void;
  goto: (time: number) => void;
}

export interface IScene extends IAnimation {
  clone: (id: string) => Node | undefined;
}

interface IAnimationPrivateProps extends INodePrivateProps {
  url: string;
  playing: boolean;
  currentTime: number;
}

interface IAnimationOptions extends INodeOptions {
  url: string;
  currentTime: number;
}

/**
 * 动画组件，和 Scene 类似，有自己独立的时间轴和脚本，可以用来实现独立的组件功能，一个场景可以容纳多个动画组件
 * 在编辑器内，动画一般由所在场景内的 controller 驱动播放，也可以调用 play 独立播放，但不再受此场景统一控制
 */
@RegNode("Animation")
export class Animation extends Node implements IScene {
  declare pp: IAnimationPrivateProps;
  /** 动画数据，记录方便实现 clone */
  json?: INodeData;
  /** 动画持续时长 */
  duration = 0;

  override get root(): Animation {
    return this;
  }

  /** 当前动画路径 */
  get url(): string {
    return this.pp.url;
  }
  set url(value: string) {
    this.load(value);
  }

  /** 当前动画播放到的时间点 */
  get currentTime(): number {
    return this.pp.currentTime;
  }
  set currentTime(value: number) {
    this.goto(value);
  }

  /** 是否正在播放 */
  get playing(): boolean {
    return this.pp.playing;
  }

  constructor(options?: IAnimationOptions) {
    super();
    this.pp.url = "";
    this.pp.playing = false;
    this.pp.currentTime = 0;
    this.setProps(options as Record<string, any>);
  }

  override destroy(): void {
    if (!this.destroyed) {
      this.stop();
      this.json = undefined;
      super.destroy();
    }
  }

  /**
   * 加载动画
   * @param url 动画路径
   * @param loadAllAssets 加载动画内的所有资源，默认为 true
   */
  async load(url: string, loadAllAssets = true) {
    if (this.pp.url !== url) {
      this.pp.url = url;
      const json = await loader.load(url);
      loadAllAssets && (await this.loadAllAssets(json));
      this.fromJson(json);
    }
    this.emit(EventType.loaded);
  }

  /**
   * 根据数据，加载动画或场景内的所有资源
   * @param json 动画或场景数据
   */
  async loadAllAssets(json: INodeData) {
    const res: string[] = [];
    this.__collectAsset(json, res);
    if (res.length) {
      const all = [];
      for (const url of res) {
        all.push(loader.load(url));
      }
      await Promise.all(all);
    }
  }

  private __collectAsset(data: INodeData, res: string[]) {
    if (data.props.url) res.push(data.props.url as string);
    if (data.children?.length) {
      for (const child of data.children) {
        this.__collectAsset(child, res);
      }
    }
  }

  /**
   * 播放动画，在编辑器内，动画一般由 controller 控制播放，也可以调用此方法独立播放
   */
  play(): void {
    if (!this.pp.playing) {
      this.pp.playing = true;
      this.stage?.timer.frameLoop(1, this.update, this);
      this.update();
      this.emit(EventType.played);
    }
  }

  /**
   * 更新动画及脚本
   */
  update(): void {
    if (this.enabled) {
      // 累加当前时间，并更新动画或场景 timer 和 脚本
      this.pp.currentTime += this.stage!.timer.delta;
      // 遍历所有子节点，执行脚本
      this.__updateScripts(this);
    }
  }

  private __updateScripts(node: Node) {
    if (node.enabled) {
      const { scripts } = node;
      if (scripts.length) {
        for (const script of scripts) {
          script.update(this.pp.currentTime);
        }
      }
      const { children } = node;
      if (children.length) {
        for (const child of children) {
          this.__updateScripts(child);
        }
      }
    }
  }

  /**
   * 停止播放
   */
  stop(): void {
    if (this.pp.playing) {
      this.pp.playing = false;
      this.stage?.timer.clear(this.update, this);
      this.emit(EventType.stopped);
    }
  }

  /**
   * 移动到某个时间点
   * @param time 时间点
   */
  goto(time: number) {
    this.pp.currentTime = time > 0 ? time : 0;
    this.__goto(this);
  }

  private __goto(node: Node) {
    if (node.enabled) {
      // 过滤掉动画自身的控制器
      const scripts = node === this ? node.scripts.filter((s) => !(s instanceof Controller)) : node.scripts;
      if (scripts.length) {
        // 重置脚本
        for (let i = scripts.length - 1; i > -1; i--) {
          scripts[i].reset(this.pp.currentTime);
        }
        // 定位脚本位置
        for (const script of scripts) {
          script.goto(this.pp.currentTime);
        }
      }
      const { children } = node;
      if (children.length) {
        for (const child of children) {
          this.__goto(child);
        }
      }
    }
  }

  /**
   * 移动到某个时间点并停止播放
   * @param time 时间点
   */
  gotoAndStop(time: number): void {
    this.stop();
    // goto 可能会触发脚本的执行，需要后置
    this.goto(time);
  }

  /**
   * 移动到某个时间点并继续播放
   * @param time 时间点
   */
  gotoAndPlay(time: number): void {
    this.play();
    // goto 可能会触发脚本的执行，需要后置
    this.goto(time);
  }

  /**
   * 从数据创建动画或场景
   * @param json 动画或场景数据
   */
  fromJson(json: INodeData): void {
    this.json = json;
    super.fromJson(json);
  }

  /**
   * clone 动画或场景中某个节点，仅限于初始状态
   * @param id 节点 id
   * @returns 返回被 clone 的节点实例
   */
  clone(id: string): Node | undefined {
    const data = this.__findNodeData(id, this.json);
    if (data) {
      const node = Register.getNode(data.type);
      if (node) {
        node.fromJson(data);
        node.id = getUID();
        return node;
      }
    }
    return undefined;
  }

  private __findNodeData(id: string, data?: INodeData): INodeData | undefined {
    if (!data) return undefined;
    if (data.id === id) return data;
    if (data.children?.length) {
      for (const child of data.children) {
        const node = this.__findNodeData(id, child);
        if (node) return node;
      }
    }
    return undefined;
  }
}
