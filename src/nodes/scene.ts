import { EventType } from "../const";
import { loader } from "../loader";
import { RegNode } from "../utils/decorators";
import { getRegNode } from "../utils/register";
import { getUID } from "../utils/utils";
import type { INodeData, INodeOptions } from "./node";
import { type INodePrivateProps, Node } from "./node";

export interface IAnimation extends Node {
  duration: number;
  play: () => void;
  stop: () => void;
}

export interface IScene extends IAnimation {
  timeScale: number;
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
 * 所有动画、脚本、动效均由所在的场景统一驱动
 */
@RegNode("Scene")
export class Scene extends Node implements IScene {
  declare pp: IAnimationPrivateProps;
  /** 动画数据，记录方便实现 clone */
  json?: INodeData;
  /** 动画持续时长 */
  duration = 0;
  timeScale = 1;

  override get scene(): Scene {
    return this;
  }

  /** 当前动画播放到的时间点 */
  get currentTime(): number {
    return this.pp.currentTime;
  }

  /** 是否正在播放 */
  get playing(): boolean {
    return this.pp.playing;
  }

  /** 当前动画路径 */
  get url(): string {
    return this.pp.url;
  }
  set url(value: string) {
    this.load(value);
  }

  constructor(options?: IAnimationOptions) {
    super();
    this.pp.url = "";
    this.pp.playing = false;
    this.pp.currentTime = 0;
    this.setProps(options as Record<string, any>);

    this.on(EventType.addToStage, this.play, this);
    this.on(EventType.removed, this.stop, this);
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
   * @param loadAllAssets 预加载动画内的所有资源，默认为 true
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
      this.pp.currentTime += this.stage!.timer.delta * this.timeScale;
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
      const node = getRegNode(data.type);
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
