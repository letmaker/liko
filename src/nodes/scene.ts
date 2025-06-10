import { EventType } from '../const';
import { loader } from '../loader';
import { Camera } from '../scripts/node/camera';
import { RegNode } from '../utils/decorators';
import { createNodeInstance } from '../utils/register';
import { cloneJson, getUID } from '../utils/utils';
import type { INodeData, INodeOptions, INodePrivateProps } from './node';
import { LikoNode } from './node';

export interface IAnimation extends LikoNode {
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
  isPlaying: boolean;
  /** 是否暂停 */
  paused: boolean;
  /** 克隆场景中的节点 */
  cloneNode<T extends LikoNode>(options: { id?: string; label?: string }): T | undefined;
  /** 暂停播放 */
  pause: () => void;
  /** 恢复播放 */
  resume: () => void;
  /**
   * 加载场景
   * @param url - 场景资源路径
   * @param preloadAssets - 是否预加载场景内的所有资源
   */
  load: (url: string, preloadAssets?: boolean) => Promise<void>;
}

interface IScenePrivateProps extends INodePrivateProps {
  url: string;
  currentTime: number;
  isPlaying: boolean;
  paused: boolean;
}

interface ISceneOptions extends INodeOptions {
  /** 场景资源路径 */
  url?: string;
  /** 场景播放时的回调 */
  onPlayed?: () => void;
  /** 场景停止时的回调 */
  onStopped?: () => void;
  /** 场景暂停时的回调 */
  onPaused?: () => void;
  /** 场景恢复播放时的回调 */
  onResumed?: () => void;
  /** 场景加载进度回调 */
  onProgress?: (progress: number) => void;
  /** 场景加载完成时的回调 */
  onLoaded?: () => void;
  /** 场景加载失败时的回调 */
  onError?: (error: Error) => void;
  /** 场景更新时的回调 */
  onUpdate?: (delta: number) => void;
}

/**
 * 场景类，用于管理场景内的节点、动画、脚本等内容
 * 所有动画、脚本、动效均由所在的场景统一驱动
 */
@RegNode('Scene')
export class Scene extends LikoNode implements IScene {
  declare pp: IScenePrivateProps;
  /** 场景数据，用于实现节点克隆 */
  json?: INodeData;
  /** 时间缩放比率，控制场景播放速度 */
  timeScale = 1;

  /** 场景的摄像机 */
  camera: Camera = new Camera();

  /** 场景更新时的回调，delta单位为秒 */
  onUpdate?: (delta: number) => void;

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
  get isPlaying(): boolean {
    return this.pp.isPlaying;
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
    pp.url = '';
    pp.currentTime = 0;
    pp.isPlaying = false;
    pp.paused = false;

    this.on(EventType.addToStage, this.play, this);
    this.on(EventType.removed, this.stop, this);

    this.addScript(this.camera);
    this.setProps(options as Record<string, any>);
  }

  /**
   * 销毁场景实例
   * @returns 当前实例，支持链式调用
   */
  override destroy(): void {
    if (this.destroyed) return;

    this.stop();
    this.json = undefined;
    super.destroy();
  }

  /**
   * 加载场景
   * @param url - 场景资源路径
   * @param preloadAssets - 是否预加载场景内的所有资源，默认为 true
   * @returns Promise 对象，加载完成后解析
   */
  async load(url: string, preloadAssets = true) {
    if (this.pp.url === url && this.json) {
      this.emit(EventType.loaded);
      return;
    }

    this.pp.url = url;
    try {
      const json = await loader.load<INodeData>(url);
      if (!json) return;

      if (preloadAssets) {
        await this.preloadAssets(json);
      }
      this.fromJson(json);
      this.emit(EventType.loaded);
    } catch (error) {
      this.emit(EventType.error, error);
      throw error;
    }
  }

  /**
   * 加载场景内的所有资源
   * @param json - 场景数据
   * @returns Promise 对象，所有资源加载完成后解析
   */
  async preloadAssets(json: INodeData) {
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
   * @returns 当前实例，支持链式调用
   */
  play(): this {
    const pp = this.pp;
    if (!pp.isPlaying) {
      pp.isPlaying = true;
      pp.paused = false;
      this.stage?.timer.onFrame(this.update, this);
      this.emit(EventType.played);
    }
    return this;
  }

  /**
   * 停止播放
   * @returns 当前实例，支持链式调用
   */
  stop(): this {
    if (this.pp.isPlaying) {
      this.pp.isPlaying = false;
      this.stage?.timer.clearTimer(this.update, this);
      this.emit(EventType.stopped);
    }
    return this;
  }

  /**
   * 暂停播放
   * @returns 当前实例，支持链式调用
   */
  pause(): this {
    const pp = this.pp;
    if (!pp.isPlaying || pp.paused) return this;

    pp.paused = true;
    this.stage?.timer.clearTimer(this.update, this);
    this.emit(EventType.paused);
    return this;
  }

  /**
   * 恢复播放
   * @returns 当前实例，支持链式调用
   */
  resume(): this {
    const pp = this.pp;
    if (!pp.isPlaying || !pp.paused) return this;

    pp.paused = false;
    this.stage?.timer.onFrame(this.update, this);
    this.emit(EventType.resumed);
    return this;
  }

  /**
   * 更新场景及脚本
   * @param delta - 距离上一帧的时间间隔，可选参数
   * @returns 当前实例，支持链式调用
   */
  update(delta?: number): this {
    const stage = this.stage;
    if (!this.enabled || !stage || this.pp.paused) return this;

    const scaleDelta = delta ?? stage.timer.delta * this.timeScale;
    this.pp.currentTime += scaleDelta;
    // 遍历所有子节点，执行脚本
    this._$updateScripts(this, scaleDelta);
    this.emit(EventType.update, scaleDelta);
    this.onUpdate?.(scaleDelta);

    return this;
  }

  private _$updateScripts(node: LikoNode, delta: number) {
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
   * 从数据创建场景
   * @param json - 场景数据
   * @returns 当前实例，支持链式调用
   */
  override fromJson(json: INodeData): this {
    this.json = json;
    super.fromJson(json);
    return this;
  }

  /**
   * 克隆场景中某个节点
   * @param options - 克隆选项，可以通过 id 或 label 指定要克隆的节点
   * @returns 克隆的节点实例，如果未找到节点则返回 undefined
   */
  cloneNode<T extends LikoNode>(options: { id?: string; label?: string }): T | undefined {
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
