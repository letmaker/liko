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
 *
 * 使用示例：
 * ```typescript
 * // 创建场景实例
 * const scene = new Scene({
 *   url: '/assets/scenes/level1.json',
 *   onLoaded: () => console.log('场景加载完成'),
 *   onPlayed: () => console.log('场景开始播放'),
 *   onUpdate: (delta) => console.log('场景更新', delta)
 * });
 *
 * // 手动加载场景
 * await scene.load('/assets/scenes/level1.json');
 *
 * // 控制场景播放
 * scene.play();        // 开始播放
 * scene.pause();       // 暂停播放
 * scene.resume();      // 恢复播放
 * scene.stop();        // 停止播放
 *
 * // 克隆场景中的节点
 * const clonedNode = scene.cloneNode<Sprite>({ label: 'enemy' });
 * if (clonedNode) {
 *   this.addChild(clonedNode);
 * }
 *
 * // 设置时间缩放（2倍速播放）
 * scene.timeScale = 2.0;
 *
 * // 访问摄像机
 * scene.camera.follow(player);
 * ```
 *
 * 注意事项：
 * - 场景会在添加到舞台时自动开始播放，从舞台移除时自动停止
 * - 场景的所有脚本更新由场景统一驱动，包括子节点的脚本
 * - 时间缩放会影响所有动画和脚本的执行速度
 * - 克隆节点时会生成新的唯一ID，避免ID冲突
 * - 预加载资源时会触发进度事件，可通过onProgress回调监听
 */
@RegNode('Scene')
export class Scene extends LikoNode implements IScene {
  declare pp: IScenePrivateProps;
  /** 场景数据，用于实现节点克隆功能，保存原始的JSON结构 */
  json?: INodeData;
  /** 时间缩放比率，控制场景播放速度，1.0为正常速度，2.0为两倍速 */
  timeScale = 1;

  /** 场景的摄像机实例，用于控制视角和渲染 */
  camera: Camera = new Camera();

  /** 场景更新时的回调函数，delta参数为距离上一帧的时间间隔（秒） */
  onUpdate?: (delta: number) => void;

  /**
   * 获取当前场景实例
   */
  override get scene(): Scene {
    return this;
  }

  /**  获取当前动画播放到的时间点（秒）,从开始播放到现在经过的总时间 */
  get currentTime(): number {
    return this.pp.currentTime;
  }

  /** 获取是否正在播放状态 */
  get isPlaying(): boolean {
    return this.pp.isPlaying;
  }

  /** 获取是否处于暂停状态 */
  get paused(): boolean {
    return this.pp.paused;
  }

  /** 获取当前场景资源路径 */
  get url(): string {
    return this.pp.url;
  }

  /** 设置场景资源路径，会自动触发场景加载 */
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

    // 监听舞台事件，自动控制播放状态
    this.on(EventType.addedToStage, this.play, this);
    this.on(EventType.removed, this.stop, this);

    // 添加摄像机脚本
    this.addScript(this.camera);
    this.setProps(options as Record<string, unknown>);
  }

  /**
   * 销毁场景实例，清理所有资源和引用
   * 停止播放并释放内存，销毁后不可再使用
   */
  override destroy(): void {
    if (this.destroyed) return;

    this.stop();
    this.json = undefined;
    super.destroy();
  }

  /**
   * 加载场景数据
   * @param url 场景文件的URL路径
   * @param preloadAssets 是否预加载场景内的所有资源，默认为true
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
   * 预加载场景内引用的所有资源文件
   * 遍历场景JSON数据，收集所有资源URL并预先加载
   * @param json 场景数据对象
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
   * 开始播放场景
   * 启动场景的更新循环，开始执行所有脚本和动画
   * @returns 当前场景实例，支持链式调用
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
   * 停止播放场景
   * 停止场景的更新循环，所有脚本和动画将停止执行
   * @returns 当前场景实例，支持链式调用
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
   * 暂停播放场景
   * 暂停场景的更新循环，保持当前状态不变
   * @returns 当前场景实例，支持链式调用
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
   * 恢复播放场景
   * 从暂停状态恢复播放，继续执行脚本和动画
   * @returns 当前场景实例，支持链式调用
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
   * 更新场景及其所有脚本
   * 在每一帧被调用，负责更新所有子节点的脚本
   * @param delta 距离上一帧的时间间隔（秒），可选参数
   */
  update(delta?: number): void {
    const stage = this.stage;
    if (!this.enabled || !stage || this.pp.paused) return;

    const scaleDelta = delta ?? stage.timer.delta * this.timeScale;
    this.pp.currentTime += scaleDelta;
    // 遍历所有子节点，执行脚本
    this._$updateScripts(this, scaleDelta);
    this.emit(EventType.update, scaleDelta);
    this.onUpdate?.(scaleDelta);
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
   * 从JSON数据重建场景结构
   * @param json 场景数据对象
   * @returns 当前场景实例，支持链式调用
   */
  override fromJson(json: INodeData): this {
    this.json = json;
    super.fromJson(json);
    return this;
  }

  /**
   * 克隆场景中指定的节点
   * 根据ID或标签查找节点，深度克隆其数据并创建新的实例
   * @param options 克隆选项，包含id或label用于定位目标节点
   * @returns 克隆的节点实例，如果未找到则返回undefined
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
