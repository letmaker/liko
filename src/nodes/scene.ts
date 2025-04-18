import { EventType } from "../const";
import { loader } from "../loader";
import { RegNode } from "../utils/decorators";
import { createNodeInstance } from "../utils/register";
import { cloneJson, getUID } from "../utils/utils";
import type { INodeData, INodeOptions, INodePrivateProps } from "./node";
import { Node } from "./node";

export interface IAnimation extends Node {
  /** 播放动画 */
  play: () => void;
  /** 停止动画 */
  stop: () => void;
}

export interface IScene extends IAnimation {
  /** 场景资源路径 */
  url: string;
  /** 时间缩放比率 */
  timeScale: number;
  /** 当前播放时间 */
  currentTime: number;
  /** 是否正在播放 */
  playing: boolean;
  /** 是否暂停 */
  paused: boolean;
  /** 克隆场景中的节点 */
  clone<T extends Node>(options: { id?: string; label?: string }): T | undefined;
  /** 暂停播放 */
  pause: () => void;
  /** 恢复播放 */
  resume: () => void;
  /**
   * 加载场景
   * @param url - 场景资源路径
   * @param loadAllAssets - 是否预加载场景内的所有资源
   */
  load: (url: string, loadAllAssets?: boolean) => Promise<void>;
}

interface IScenePrivateProps extends INodePrivateProps {
  url: string;
  currentTime: number;
  playing: boolean;
  paused: boolean;
}

interface ISceneOptions extends INodeOptions {
  url?: string;
}

/**
 * 场景类，用于管理场景内的节点、动画、脚本等内容
 * 所有动画、脚本、动效均由所在的场景统一驱动
 */
@RegNode("Scene")
export class Scene extends Node implements IScene {
  declare pp: IScenePrivateProps;
  /** 场景数据，用于实现节点克隆 */
  json?: INodeData;
  /** 时间缩放比率，控制场景播放速度 */
  timeScale = 1;

  /**
   * 获取当前场景实例
   */
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

  /** 是否暂停 */
  get paused(): boolean {
    return this.pp.paused;
  }

  /** 当前场景资源路径 */
  get url(): string {
    return this.pp.url;
  }
  set url(value: string) {
    this.load(value);
  }

  constructor(options?: ISceneOptions) {
    super();
    const pp = this.pp;
    pp.url = "";
    pp.currentTime = 0;
    pp.playing = false;
    pp.paused = false;

    this.on(EventType.addToStage, this.play, this);
    this.on(EventType.removed, this.stop, this);

    this.setProps(options as Record<string, any>);
  }

  /**
   * 销毁场景实例
   */
  override destroy(): void {
    if (!this.destroyed) {
      this.stop();
      this.json = undefined;
      super.destroy();
    }
  }

  /**
   * 加载场景
   * @param url - 场景资源路径
   * @param loadAllAssets - 是否预加载场景内的所有资源，默认为true
   */
  async load(url: string, loadAllAssets = true) {
    if (this.pp.url !== url) {
      this.pp.url = url;
      try {
        const json = await loader.load<INodeData>(url);
        if (!json) return;

        if (loadAllAssets) {
          await this.loadAllAssets(json);
        }
        this.fromJson(json);
        this.emit(EventType.loaded);
      } catch (error) {
        this.emit(EventType.error, error);
        throw error;
      }
    } else {
      this.emit(EventType.loaded);
    }
  }

  /**
   * 加载场景内的所有资源
   * @param json - 场景数据
   */
  async loadAllAssets(json: INodeData) {
    const res: string[] = [];
    this._$collectAsset(json, res);
    const total = res.length;
    if (total) {
      const all = [];
      let loaded = 0;
      for (const url of res) {
        const p = loader.load<INodeData>(url);
        p.then(() => {
          loaded++;
          this.emit(EventType.progress, loaded / total);
        });
        all.push(p);
      }
      await Promise.all(all);
    }
  }

  private _$collectAsset(data: INodeData, res: string[]) {
    if (data.props.url) res.push(data.props.url as string);
    if (data.children?.length) {
      for (const child of data.children) {
        this._$collectAsset(child, res);
      }
    }
  }

  /**
   * 播放场景
   */
  play(): void {
    const pp = this.pp;
    if (!pp.playing) {
      pp.playing = true;
      pp.paused = false;
      this.stage?.timer.onFrame(this.update, this);
      this.emit(EventType.played);
    }
  }

  /**
   * 暂停播放
   */
  pause(): void {
    const pp = this.pp;
    if (!pp.playing || pp.paused) return;

    pp.paused = true;
    this.stage?.timer.clearTimer(this.update, this);
    this.emit(EventType.paused);
  }

  /**
   * 恢复播放
   */
  resume(): void {
    const pp = this.pp;
    if (!pp.playing || !pp.paused) return;

    pp.paused = false;
    this.stage?.timer.onFrame(this.update, this);
    this.emit(EventType.resumed);
  }

  /**
   * 更新场景及脚本
   */
  update(delta?: number): void {
    const stage = this.stage;
    if (!this.enabled || !stage || this.pp.paused) return;

    const scaleDelta = delta ?? stage.timer.delta * this.timeScale;
    this.pp.currentTime += scaleDelta;
    // 遍历所有子节点，执行脚本
    this._$updateScripts(this, scaleDelta);
  }

  private _$updateScripts(node: Node, delta: number) {
    if (node.enabled) {
      const { scripts } = node;
      if (scripts.length) {
        for (const script of scripts) {
          script.update(delta);
        }
      }
      const { children } = node;
      if (children.length) {
        for (const child of children) {
          this._$updateScripts(child, delta);
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
      this.stage?.timer.clearTimer(this.update, this);
      this.emit(EventType.stopped);
    }
  }

  /**
   * 从数据创建场景
   * @param json - 场景数据
   */
  override fromJson(json: INodeData): void {
    this.json = json;
    super.fromJson(json);
  }

  /**
   * 克隆场景中某个节点
   */
  clone<T extends Node>(options: { id?: string; label?: string }): T | undefined {
    const data = this._$findNodeData(options, this.json);
    if (data) {
      // 深度克隆数据
      const json = cloneJson(data);
      const node = createNodeInstance(json.type);
      if (node) {
        json.props.id = getUID();
        json.props.editorOnly = false;
        node.fromJson(json);
        return node as T;
      }
    }
    console.warn(`clone node ${options.id ?? options.label} failed`);
    return undefined;
  }

  private _$findNodeData(options: { id?: string; label?: string }, json?: INodeData): INodeData | undefined {
    if (!json) return undefined;

    const { id, label } = options;
    if (json.id === id) return json;
    if (json.props.label === label) return json;

    if (json.children?.length) {
      for (const child of json.children) {
        const data = this._$findNodeData(options, child);
        if (data) return data;
      }
    }
    return undefined;
  }
}
