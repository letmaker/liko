import { DEG_TO_RAD, DirtyType, EventType, RAD_TO_DEG } from '../const';
import type { LikoPointerEvent } from '../events/pointer-event';
import { Bounds } from '../math/bounds';
import { Matrix } from '../math/matrix';
import { ObservablePoint } from '../math/observable-point';
import { type IPoint, Point } from '../math/point';
import type { RotatingRect } from '../math/rotating-rect';
import { Transform } from '../math/transform';
import type { Filter } from '../render/filter/filter';
import { NodeCache } from '../render/utils/node-cache';
import type { BaseScript } from '../scripts/base-script';
import { Color, type ColorData } from '../utils/color';
import { Dispatcher } from '../utils/dispatcher';
import { createFilterInstance, createNodeInstance } from '../utils/register';
import { createScript, getUID } from '../utils/utils';
import type { IScene } from './scene';
import type { Stage } from './stage';

/** 节点数据接口，用于序列化和反序列化节点 */
export interface INodeData {
  /** 节点 id，作为节点的唯一标识符，通常由编辑器指定 */
  id: string;
  /** 节点类型，通常由编辑器指定，用于标识节点的具体类别 */
  type: string;
  /** 节点描述，提供给 AI 读取的附加信息 */
  description?: string;
  /** 节点属性集合，包含节点的各种配置参数 */
  props: {
    /** 节点标签 */
    label?: string;
    /** 是否启用节点 */
    enabled?: boolean;
    /** 是否仅编辑器可见 */
    editorOnly?: boolean;
    /** 节点位置 */
    position?: IPoint;
    /** 节点缩放 */
    scale?: IPoint;
    /** 节点锚点 */
    anchor?: IPoint;
    /** 节点旋转弧度 */
    rotation?: number;
    /** 节点旋转角度 */
    angle?: number;
    /** 节点宽度 */
    width?: number;
    /** 节点高度 */
    height?: number;
    /** 节点透明度 */
    alpha?: number;
    /** 节点可见性 */
    visible?: boolean;
    /** 是否启用指针事件 */
    pointerEnabled?: boolean;
    /** 是否启用子节点指针事件 */
    pointerEnabledForChildren?: boolean;
    [key: string]: unknown;
  };
  /** 子节点数据列表，用于构建节点树结构 */
  children?: INodeData[];
  /** 滤镜数据列表，用于为节点添加视觉效果 */
  filters?: IFilterData[];
  /** 脚本数据列表，用于为节点添加行为逻辑 */
  scripts?: IScriptData[];
}

/** 脚本数据接口，用于序列化和反序列化脚本 */
export interface IScriptData {
  /** 脚本唯一标识符 */
  id: string;
  /** 脚本类名或路径 */
  script: string;
  /** 脚本路径 */
  path?: string;
  /** 脚本描述，提供给 AI 读取的附加信息 */
  description?: string;
  /** 脚本属性集合，包含脚本的各种配置参数 */
  props: {
    /** 脚本标签 */
    label?: string;
    /** 是否启用脚本 */
    enabled?: boolean;
    [key: string]: unknown;
  };
}

/** 滤镜数据接口，用于序列化和反序列化滤镜 */
export interface IFilterData {
  /** 滤镜唯一标识符 */
  id: string;
  /** 滤镜类型，用于标识滤镜的具体类别 */
  type: string;
  /** 滤镜描述，提供给 AI 读取的附加信息 */
  description?: string;
  /** 滤镜属性集合，包含滤镜的各种配置参数 */
  props: {
    [key: string]: unknown;
  };
}

const pointerMap: Record<string, boolean> = {
  click: true,
  pointerdown: true,
  pointerup: true,
  pointermove: true,
  pointerover: true,
  pointerout: true,
  pointerupoutside: true,
};

const defaultTF = new Transform();
const defaultData: Record<string, any> = {};
const defaultChildren: LikoNode[] = [];
const defaultFilters: Filter[] = [];
const defaultScripts: BaseScript[] = [];
const defaultEvent = new Dispatcher();

export interface INodePrivateProps {
  id: string;
  userData: Record<string, any>;
  event: Dispatcher;
  children: LikoNode[];
  filters: Filter[];
  scripts: BaseScript[];
  transform: Transform;
  tintColor: Color;
  alpha: number;
  localMatrix: Matrix;
  worldMatrix: Matrix;
  position: ObservablePoint;
  anchor: ObservablePoint;
  width: number;
  height: number;
  visible: boolean;
  destroyed: boolean;
  dirty: number;
  stage?: Stage;
  parent?: LikoNode;
  localBounds: Bounds;
  boundsDirty: boolean;
}

/** 节点初始化选项接口，用于创建节点时的配置 */
export interface INodeOptions {
  /** 节点唯一标识符，用于在场景中唯一标识 */
  id?: string;
  /** 节点标签，用于快速查找和识别节点 */
  label?: string;
  /** 节点位置，相对于父节点的坐标 */
  position?: IPoint;
  /** 节点缩放，影响节点的显示大小 */
  scale?: IPoint;
  /** 节点锚点，以宽高的百分比表示，影响旋转和缩放的中心点 */
  anchor?: IPoint;
  /** 节点旋转弧度，以弧度为单位 */
  rotation?: number;
  /** 节点旋转角度，以角度为单位 */
  angle?: number;
  /** 节点宽度，单位为像素 */
  width?: number;
  /** 节点高度，单位为像素 */
  height?: number;
  /** 节点透明度，范围 0-1，0 表示完全透明 */
  alpha?: number;
  /** 节点可见性，控制节点是否在屏幕上显示 */
  visible?: boolean;
  /** 是否启用指针事件，控制节点是否响应鼠标/触摸事件 */
  pointerEnabled?: boolean;
  /** 是否启用子节点指针事件，控制子节点是否响应鼠标/触摸事件 */
  pointerEnabledForChildren?: boolean;
  /** 用户自定义数据，可存储任意附加信息 */
  userData?: Record<string, any>;
  /** 父节点，指定节点的父级 */
  parent?: LikoNode;
  /** 脚本列表，为节点添加行为逻辑 */
  scripts?: BaseScript[];

  /** 点击事件回调函数 */
  onClick?: (e: LikoPointerEvent) => void;
  /** 指针按下事件回调函数 */
  onPointerDown?: (e: LikoPointerEvent) => void;
  /** 指针抬起事件回调函数 */
  onPointerUp?: (e: LikoPointerEvent) => void;
  /** 指针移动事件回调函数 */
  onPointerMove?: (e: LikoPointerEvent) => void;
  /** 指针进入事件回调函数 */
  onPointerOver?: (e: LikoPointerEvent) => void;
  /** 指针离开事件回调函数 */
  onPointerOut?: (e: LikoPointerEvent) => void;
  /** 指针在节点外部抬起事件回调函数 */
  onPointerUpOutside?: (e: LikoPointerEvent) => void;
}

/**
 * 节点基类，是引擎中所有可视对象的基础
 *
 * 提供了完整的节点树结构管理、事件系统、变换系统、滤镜系统和脚本系统等核心功能。
 * 所有可渲染的对象（如精灵、容器、文本等）都继承自此类。
 *
 * ## 核心概念
 *
 * ### 节点树结构
 * - 节点通过父子关系形成树状结构，支持添加、移除、查找子节点
 * - 变换属性（位置、缩放、旋转等）会继承父节点的变换
 * - 事件会从子节点向父节点冒泡传递
 *
 * ### 坐标系统
 * - **本地坐标系**：相对于父节点的坐标系，用于设置节点的 position
 * - **世界坐标系**：相对于舞台的绝对坐标系，考虑了所有父节点的变换
 * - 提供 localToWorld 和 worldToLocal 方法进行坐标转换
 *
 * ### 变换属性
 * - **position**：节点在父坐标系中的位置
 * - **scale**：缩放比例，影响节点及子节点的显示大小
 * - **rotation**：旋转弧度，围绕锚点进行旋转
 * - **anchor**：锚点，决定旋转和缩放的中心点，以宽高百分比表示
 *
 * ### 尺寸系统
 * - 可以显式设置 width 和 height，或通过 getLocalBounds() 自动计算
 * - 锚点会影响节点的对齐方式和旋转中心
 *
 * ## 基本使用示例
 *
 * ```typescript
 * // 创建并配置节点
 * const node = new SomeNode({
 *   position: { x: 100, y: 200 },
 *   scale: { x: 1.5, y: 1.5 },
 *   rotation: Math.PI / 4, // 45度
 *   anchor: { x: 0.5, y: 0.5 }, // 中心锚点
 *   alpha: 0.8,
 *   visible: true
 * });
 *
 * // 节点树操作
 * parent.addChild(node);
 * node.addChild(childNode);
 * node.removeChild(childNode);
 *
 * // 坐标转换
 * const worldPos = node.localToWorld({ x: 0, y: 0 });
 * const localPos = node.worldToLocal(worldPos);
 *
 * // 事件处理
 * node.on(EventType.click, (e) => {
 *   console.log('节点被点击', e);
 * });
 *
 * // 查找子节点
 * const child = node.findChild<Sprite>({ label: 'hero' });
 * const script = node.findScript<MyScript>({ Class: MyScript });
 *
 * // 添加脚本和滤镜
 * node.addScript(new MovementScript());
 * node.addFilter(new BlurFilter());
 * ```
 *
 * ## 生命周期和销毁
 *
 * ```typescript
 * // 销毁节点（会递归销毁所有子节点）
 * node.destroy();
 *
 * // 检查是否已销毁
 * if (node.destroyed) {
 *   console.log('节点已销毁，不可再使用');
 * }
 * ```
 *
 * ## 重要注意事项
 *
 * 1. **坐标系理解**：position 是相对于父节点的，要获取绝对位置需要使用 worldMatrix 或 localToWorld
 *
 * 2. **锚点概念**：anchor 影响旋转和缩放的中心点，(0,0) 是左上角，(0.5,0.5) 是中心，(1,1) 是右下角
 *
 * 3. **变换继承**：子节点会继承父节点的所有变换，包括位置、缩放、旋转和透明度
 *
 * 4. **事件冒泡**：鼠标事件会从最深的子节点向上冒泡到父节点，可以在任何级别拦截
 *
 * 5. **性能优化**：
 *    - 大量静态子节点的容器可以启用 cacheEnabled 提升渲染性能
 *    - 不需要交互的节点不要启用 pointerEnabled 以减少事件检测开销
 *    - 使用 visible=false 隐藏不需要渲染的节点
 *
 * 6. **内存管理**：
 *    - 必须调用 destroy() 来正确清理节点和避免内存泄漏
 *    - 销毁会自动清理所有子节点、脚本、滤镜和事件监听
 *
 * 7. **边界计算**：getLocalBounds() 结果会被缓存并在节点级别复用，需要延迟使用时应调用 clone()
 */
export abstract class LikoNode {
  /** @private 私有属性集合，可以读取但不应直接修改 */
  pp: INodePrivateProps = {
    id: '',
    userData: defaultData,
    event: defaultEvent,
    children: defaultChildren,
    filters: defaultFilters,
    scripts: defaultScripts,
    transform: defaultTF,
    tintColor: Color.Default,
    alpha: 1,
    localMatrix: new Matrix(),
    worldMatrix: new Matrix(),
    position: new ObservablePoint(this),
    anchor: new ObservablePoint(this),
    /** -1 代表通过 getLocalBounds 获得宽 */
    width: -1,
    /** -1 代表通过 getLocalBounds 获得高 */
    height: -1,
    visible: true,
    destroyed: false,
    dirty: DirtyType.transform | DirtyType.size | DirtyType.texture | DirtyType.color,
    stage: undefined,
    parent: undefined,
    localBounds: new Bounds(),
    boundsDirty: true,
  };

  /**
   * 是否启用节点，控制节点的整体可用性
   *
   * 设为 false 时节点完全不可用，脚本不执行，与 visible 不同：
   * - enabled=false：节点逻辑和渲染都停止
   * - visible=false：仅停止渲染，逻辑仍然执行
   */
  enabled = true;

  /**
   * 节点标签名称，用于标识和查找节点
   *
   * 通常用于 findChild({ label: 'name' }) 等查找操作，
   * 不要求唯一性，可以有多个节点使用相同标签，查找时会返回第一个匹配的节点
   */
  label = '';

  /**
   * 是否启用渲染缓存，用于性能优化
   *
   * 适用于包含大量静态子节点的容器，启用后会将子节点渲染结果缓存，
   * 减少重复渲染开销。注意：只有在子节点很少变化时才应启用
   */
  cacheEnabled = false;

  /**
   * 是否启用指针事件处理，控制节点是否响应鼠标/触摸交互
   *
   * 默认为 false 以提高性能，添加指针事件监听器时会自动启用。
   * 启用后节点会参与点击测试，当父节点也启用时会优先检测父节点。
   * 禁用此属性可以让指针事件"穿透"到下层节点
   */
  pointerEnabled = false;

  /**
   * 是否启用子节点的指针事件处理，控制是否检测子节点的交互
   *
   * 即使当前节点 pointerEnabled=false，如果此属性为 true，
   * 仍会检测子节点的指针事件并进行事件冒泡。这允许容器节点
   * 不响应交互但其子节点可以响应交互
   */
  pointerEnabledForChildren = false;

  constructor(options?: INodeOptions) {
    if (options) this.setProps(options as Record<string, any>);
  }

  /**
   * 销毁此节点及所有子节点，销毁后此节点不可再用
   *
   * 节点被销毁时，所有子节点、脚本、滤镜以及在 node、root、scene、stage 和 stage.timer 上的监听都会被自动取消。
   *
   * @returns 当前节点实例，支持链式调用
   */
  destroy(): void {
    if (this.pp.destroyed) return;

    this.pp.destroyed = true;
    this.enabled = false;

    this.offAll();
    this.scene?.offAll(this);
    this.stage?.offAll(this);
    this.stage?.timer.clearAll(this);
    this.removeSelf();

    this.destroyScripts();
    this.destroyFilters();
    this.destroyChildren();
  }

  /** 是否已被销毁，销毁后不可再用 */
  get destroyed(): boolean {
    return this.pp.destroyed;
  }

  /**
   * 舞台节点引用，提供根级渲染和输入管理
   *
   * 只有当节点被添加到舞台的节点树中时此属性才有值。
   */
  get stage(): Stage | undefined {
    return this.pp.stage;
  }

  /**
   * 场景节点引用，提供场景级的管理功能
   *
   * 只有当节点被添加到场景节点的子树中时此属性才有值。
   * 建议在频繁使用时缓存为局部变量以减少向上遍历的开销
   */
  get scene(): IScene | undefined {
    // TODO 这里看看是不是继续递归？还是类似 stage 一样，存储起来
    return this.pp.parent?.scene;
  }

  /**
   * 父节点引用，表示节点在树结构中的上级节点
   *
   * 只有当节点被添加到某个父节点中时此属性才有值。
   * 设置此属性会自动调用相应的 addChild 或 removeSelf 操作
   */
  get parent(): LikoNode | undefined {
    return this.pp.parent;
  }
  set parent(value: LikoNode | undefined) {
    if (value) {
      value.addChild(this);
    } else {
      this.removeSelf();
    }
  }

  /**
   * 子节点列表，只读属性，获取当前节点的所有直接子节点
   *
   * 此数组为只读，不应直接修改。要管理子节点，请使用 addChild、removeChild 等方法。
   * 子节点在列表中的顺序决定了渲染顺序，索引越大的节点渲染在越上层。
   */
  get children(): LikoNode[] {
    return this.pp.children;
  }

  /**
   * 滤镜列表，只读属性，获取当前节点应用的所有滤镜效果
   *
   * 此数组为只读，不应直接修改。要管理滤镜，请使用 addFilter、removeFilter 等方法。
   * 滤镜按照添加顺序依次应用，可以通过组合多个滤镜创建复杂的视觉效果。
   */
  get filters(): Filter[] {
    return this.pp.filters;
  }

  /**
   * 脚本列表，获取或设置当前节点的所有脚本实例
   *
   * 脚本用于为节点添加行为逻辑和交互功能。设置新的脚本列表时，
   * 会先销毁现有的所有脚本，然后添加新脚本。脚本按照添加顺序执行。
   */
  get scripts(): BaseScript[] {
    return this.pp.scripts;
  }
  set scripts(value: BaseScript[]) {
    this.destroyScripts();
    for (const script of value) {
      this.addScript(script);
    }
  }

  /**
   * 自定义数据存储，用于存储节点相关的任意附加信息
   *
   * 可以在此存储游戏逻辑相关的数据，如角色属性、状态信息等。
   * 访问时会自动创建空对象，因此可以直接赋值使用。
   */
  get userData(): Record<string, any> {
    if (this.pp.userData === defaultData) this.pp.userData = {};
    return this.pp.userData;
  }
  set userData(value: Record<string, any>) {
    this.pp.userData = value;
  }

  /**
   * 节点唯一标识符，用于在节点树中唯一标识节点
   *
   * 如果未手动设置，会自动生成唯一 ID。在场景编辑器中通常用于节点的查找和引用。
   */
  get id(): string {
    if (!this.pp.id) this.pp.id = getUID();
    return this.pp.id;
  }
  set id(value: string) {
    if (this.pp.id !== value) {
      this.pp.id = value;
    }
  }

  /**
   * 节点可见性，控制节点是否参与渲染
   *
   * 只有当 visible=true 且 enabled=true 时节点才可见。
   * 不可见的节点不会被渲染，但仍会执行脚本逻辑。
   * 子节点的可见性受父节点影响。
   */
  get visible() {
    return this.pp.visible && this.enabled;
  }
  set visible(value) {
    if (this.pp.visible !== value) {
      this.pp.visible = value;
      this.markDirty(DirtyType.child);
    }
  }

  /**
   * 节点宽度，单位为像素
   *
   * 可以显式设置宽度值，或自动从内容计算（ -1 表示自动计算）。
   * 设置宽度会影响锚点的轴心点位置，并触发 resize 事件。
   * 对于图片、文本等内容节点，通常由内容自动确定宽度。
   */
  get width(): number {
    if (this.pp.width >= 0) return this.pp.width;
    return this.getLocalBounds().width;
  }
  set width(value: number) {
    const pp = this.pp;
    if (pp.width !== value) {
      pp.width = value;
      this.transform.pivot.x = value * pp.anchor.x;
      this.emit(EventType.resize);
      this.markDirty(DirtyType.size);
    }
  }

  /**
   * 节点高度，单位为像素
   *
   * 可以显式设置高度值，或自动从内容计算（ -1 表示自动计算）。
   * 设置高度会影响锚点的轴心点位置，并触发 resize 事件。
   * 对于图片、文本等内容节点，通常由内容自动确定高度。
   */
  get height(): number {
    if (this.pp.height >= 0) return this.pp.height;
    return this.getLocalBounds().height;
  }
  set height(value: number) {
    const pp = this.pp;
    if (pp.height !== value) {
      pp.height = value;
      this.transform.pivot.y = value * pp.anchor.y;
      this.emit(EventType.resize);
      this.markDirty(DirtyType.size);
    }
  }

  /**
   * 节点位置坐标，相对于父节点的本地坐标系
   *
   * 返回可观察的坐标点对象，可以直接修改 x、y 或使用 position.set(x, y)。
   */
  get position(): ObservablePoint {
    return this.pp.position;
  }
  set position(value: IPoint) {
    this.pp.position.copyFrom(value);
  }

  /**
   * 节点缩放比率，影响节点及其子节点的显示大小
   *
   * 返回可观察的缩放点对象，1.0 表示原始大小，0.5 表示缩小一半，2.0 表示放大一倍。
   * 支持 x、y 轴独立缩放。缩放中心由 anchor 属性决定。
   */
  get scale(): ObservablePoint {
    return this.transform.scale;
  }
  set scale(value: IPoint) {
    this.transform.scale.copyFrom(value);
  }

  /**
   * 节点旋转弧度，以弧度为单位的旋转角度
   *
   * 正值为顺时针旋转，负值为逆时针旋转。旋转中心由 anchor 属性决定。
   * 范围通常在 -Math.PI 到 Math.PI 之间，支持任意弧度值。
   */
  get rotation(): number {
    return this.transform.rotation;
  }
  set rotation(value: number) {
    this.transform.rotation = value;
  }

  /**
   * 节点旋转角度，以角度为单位的旋转角度（0-360度）
   *
   * 这是 rotation 属性的角度版本，内部仍使用弧度存储。
   * 正值为顺时针旋转，90度表示向右旋转90度。
   */
  get angle(): number {
    return this.transform.rotation * RAD_TO_DEG;
  }
  set angle(value: number) {
    this.transform.rotation = value * DEG_TO_RAD;
  }

  /**
   * 节点轴心点，旋转和缩放变换的中心点坐标，只读属性
   *
   * 轴心点是以像素为单位的绝对坐标，通常由 anchor 属性自动计算得出。
   * 不建议直接修改，应该通过设置 anchor 属性来间接控制轴心点位置。
   */
  get pivot(): IPoint {
    return this.transform.pivot;
  }

  /**
   * 节点锚点，以节点宽高的百分比表示的定位点
   *
   * 范围为 0-1，(0,0) 表示左上角，(0.5,0.5) 表示中心，(1,1) 表示右下角。
   * 锚点决定了旋转和缩放的中心点，也影响节点的对齐方式。
   * 设置锚点会自动重新计算 pivot 轴心点的像素坐标。
   */
  get anchor(): ObservablePoint {
    return this.pp.anchor;
  }
  set anchor(value: IPoint) {
    this.pp.anchor.copyFrom(value);

    const { pivot } = this.transform;
    const { width, height } = this.getLocalBounds();
    if (width > 0 && height > 0) {
      pivot.x = width * value.x;
      pivot.y = height * value.y;
      this.markDirty(DirtyType.transform);
    }
  }

  /**
   * 节点叠加颜色，用于调整节点的整体色调
   *
   * 支持十六进制颜色值（如 0xff0000 表示红色）或颜色字符串。
   * 叠加颜色会与节点原有颜色进行混合，白色（0xffffff）表示不改变原色。
   */
  get tintColor(): ColorData {
    return this.pp.tintColor.value;
  }
  set tintColor(value: ColorData) {
    const pp = this.pp;
    if (pp.tintColor.value !== value) {
      if (pp.tintColor === Color.Default) pp.tintColor = new Color(value);
      pp.tintColor.value = value;
      this.markDirty(DirtyType.color);
    }
  }

  /**
   * 节点透明度，控制节点的不透明程度
   *
   * 范围为 0-1，其中 0 表示完全透明，1 表示完全不透明。
   * 透明度会影响节点及其所有子节点，父节点的透明度会与子节点相乘。
   * 设置为 0 的节点仍然可以接收指针事件。
   */
  get alpha(): number {
    return this.pp.alpha;
  }
  set alpha(value: number) {
    if (this.pp.alpha !== value) {
      this.pp.alpha = value;
      this.markDirty(DirtyType.color);
    }
  }

  /**
   * 节点世界透明度，最终参与渲染的有效透明度，只读属性
   *
   * 这是考虑了所有父节点透明度影响后的最终透明度值。
   * 等于当前节点透明度与所有父节点透明度的乘积。
   * 此值由渲染系统自动计算，无法直接设置。
   */
  get worldAlpha(): number {
    return this.pp.tintColor.alpha;
  }

  /**
   * 节点变换对象，统一管理节点的位置、旋转、缩放等2D变换属性
   *
   * 通常不需要直接操作，而是通过 position、rotation、scale 等属性间接使用。
   */
  get transform() {
    if (this.pp.transform === defaultTF) {
      this.pp.transform = new Transform({ observer: this });
    }
    return this.pp.transform;
  }

  /**
   * 本地变换矩阵，表示节点相对于父节点的几何变换
   *
   * 此矩阵包含了节点的位置、旋转、缩放信息，用于高效的几何计算。
   * 矩阵会在变换属性改变时自动重新计算，支持缓存以提高性能。
   * 设置此矩阵会自动分解并更新 position、scale、rotation 属性。
   */
  get localMatrix() {
    const { dirty, transform, localMatrix, position } = this.pp;
    // 矩阵发生变化时，才重新计算矩阵
    if (dirty & DirtyType.transform) {
      return transform.getMatrix(localMatrix, position);
    }
    return localMatrix;
  }
  set localMatrix(value) {
    const { position, scale, rotation } = value.decompose(this.pp.transform);
    this.position = position;
    this.scale = scale;
    this.rotation = rotation;
  }

  /**
   * 世界变换矩阵，表示节点相对于舞台根节点的最终变换
   *
   * 此矩阵是节点及其所有父节点变换的复合结果，用于世界坐标转换。
   * 矩阵会在任何父节点或当前节点变换时自动重新计算。
   * 用于渲染和坐标空间转换，通常不需要手动设置。
   */
  get worldMatrix() {
    const { dirty, worldMatrix } = this.pp;
    // 矩阵发生变化时，才重新计算世界矩阵
    if (dirty & DirtyType.transform) {
      const parentWorldMatrix = this._$getParentWorldMatrix(this, worldMatrix.identity());
      parentWorldMatrix.append(this.localMatrix);
    }
    return worldMatrix;
  }

  private _$getParentWorldMatrix(target: LikoNode, parentTransform: Matrix) {
    const parent = target.parent;

    if (parent) {
      this._$getParentWorldMatrix(parent, parentTransform);
      parentTransform.append(parent.localMatrix);
    }

    return parentTransform;
  }

  /**
   * 标记节点为脏状态，通知渲染系统该节点需要在下一帧更新
   *
   * 这是引擎的核心优化机制，避免每次属性变化都立即重新计算。
   * 不同类型的变化会触发不同的更新流程，系统会自动处理脏状态的传播。
   * 通常不需要手动调用，属性设置时会自动触发。
   *
   * @param type 脏标记类型，指示具体哪种属性发生了变化
   */
  markDirty(type: DirtyType) {
    const pp = this.pp;
    if ((pp.dirty & type) === 0) {
      pp.dirty |= type;
      // console.log(this.label, "---dirty-----", type);

      if (type === DirtyType.transform || type === DirtyType.color) {
        // 子节点标脏
        pp.children.length && this._$dirtyChildren(type);
      } else if (type === DirtyType.child) {
        pp.boundsDirty = true;
        // 父节点标脏
        return this._$dirtyParent(type);
      } else if (type === DirtyType.size) {
        pp.boundsDirty = true;
      }
      this._$dirtyParent(DirtyType.parent);
    }
  }

  private _$dirtyParent(type: DirtyType) {
    let parent = this.parent;
    while (parent && (parent.pp.dirty & type) === 0) {
      parent.pp.dirty |= type;
      parent = parent.parent;
    }
  }

  private _$dirtyChildren(type: DirtyType) {
    for (const child of this.children) {
      if ((child.pp.dirty & type) === 0) {
        child.pp.dirty |= type;
        child.children.length && child._$dirtyChildren(type);
      }
    }
  }

  /**
   * 添加子节点到当前节点
   *
   * 如果子节点已有父节点，会先从原父节点中移除。添加后子节点会继承当前节点的舞台引用，
   * 并触发 added 事件。如果指定了索引，子节点会被插入到指定位置。
   *
   * @param child - 要添加的子节点
   * @param index - 指定添加的索引位置（可选）
   * @returns 当前节点实例，支持链式调用
   */
  addChild<T extends LikoNode>(child: T, index?: number): this {
    const pp = this.pp;
    if (pp.children === defaultChildren) pp.children = [];
    child.removeSelf();
    child.pp.parent = this;
    if (index !== undefined) pp.children.splice(index, 0, child);
    else pp.children.push(child);
    if (pp.stage) this._$addToStage(child, pp.stage);
    child.emit(EventType.added, this);
    this.markDirty(DirtyType.child);
    return this;
  }

  private _$addToStage(child: LikoNode, stage: Stage) {
    child.pp.stage = stage;
    child.emit(EventType.addToStage, stage);
    for (const node of child.children) {
      this._$addToStage(node, stage);
    }
  }

  /**
   * 获取当前节点在父节点中的索引位置
   * @returns 返回在父节点中的索引，如果没有父节点则返回 -1
   */
  getIndexInParent(): number {
    if (this.parent) return this.parent.children.indexOf(this);
    return -1;
  }

  /**
   * 修改子节点在子节点列表中的索引位置，影响渲染层级
   *
   * 索引越大的子节点在渲染时越靠上层。通过调整索引可以改变节点的层级关系，
   * 实现置顶、置底等效果。索引必须在有效范围内，否则会抛出错误。
   *
   * @param child 要修改索引的子节点，必须是当前节点的直接子节点
   * @param index 新的索引位置，从 0 开始，必须小于子节点总数
   * @returns 返回当前节点实例，支持链式调用
   * @throws 如果索引超出范围则抛出错误
   */
  setChildIndex(child: LikoNode, index: number): this {
    const children = this.children;
    if (index < 0 || index >= children.length) {
      throw new Error(`The index ${index} is out of bounds`);
    }
    const currentIndex = child.getIndexInParent();
    children.splice(currentIndex, 1);
    children.splice(index, 0, child);
    this.markDirty(DirtyType.child);
    return this;
  }

  /**
   * 根据筛选条件查找子节点，支持多种查找方式
   *
   * 这是一个强大的节点查找工具，支持按 ID、标签名或节点类型进行查找。
   * 可以选择只查找直接子节点，或递归查找整个子树。查找按照提供的条件
   * 优先级进行：id > label > Class。找到第一个匹配的节点后立即返回。
   *
   * @param options 筛选条件对象
   * @param options.id 节点的唯一标识符，精确匹配
   * @param options.label 节点的标签名，精确匹配
   * @param options.Class 节点的类构造函数，用于类型检查
   * @param options.deep 是否递归查找所有后代节点，默认为 false
   * @returns 返回匹配的第一个子节点，未找到则返回 undefined
   */
  findChild<T extends LikoNode>(options: { id?: string; label?: string; Class?: typeof LikoNode; deep?: boolean }):
    | T
    | undefined {
    const { id, label, Class, deep } = options;
    const { children } = this.pp;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      if (id && child.id === id) return child as T;
      if (label && child.label === label) return child as T;
      if (Class && child instanceof Class) return child as T;
    }
    if (deep) {
      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i].findChild(options);
        if (child) return child as T;
      }
    }
    return undefined;
  }

  /**
   * 从当前节点中移除指定的子节点，但不销毁该节点
   *
   * 这是一个"软删除"操作，只是解除父子关系，不会销毁子节点。
   * 被移除的子节点可以重新添加到其他父节点中继续使用。
   *
   * @param child 要移除的子节点，如果不是当前节点的子节点则忽略
   * @returns 返回当前节点实例，支持链式调用
   */
  removeChild<T extends LikoNode>(child?: T): this {
    if (child) {
      const index = this.pp.children.indexOf(child);
      if (index !== -1) {
        child.pp.parent = undefined;
        child.pp.stage = undefined;
        this.pp.children.splice(index, 1);
        child.emit(EventType.removed, this);
        this.markDirty(DirtyType.child);
      }
    }
    return this;
  }

  /**
   * 将当前节点从其父节点中移除，相当于"取消挂载"
   *
   * 这是一个安全的移除操作，即使当前节点没有父节点也不会出错。
   * 移除后节点会脱离节点树，但可以重新添加到其他位置。
   * 相当于调用 parent.removeChild(this)。
   *
   * @returns 返回当前节点实例，支持链式调用
   */
  removeSelf(): this {
    if (this.pp.parent) this.pp.parent.removeChild(this);
    return this;
  }

  /**
   * 移除当前节点的所有子节点，但不销毁它们
   *
   * 这是一个批量移除操作，类似于多次调用 removeChild。
   * 所有子节点都会被"软删除"，可以重新添加到其他位置使用。
   * 适用于需要清空容器但保留子节点的场景。
   *
   * @returns 返回当前节点实例，支持链式调用
   */
  removeChildren(): this {
    const { children } = this;
    if (children.length) {
      for (const child of children) {
        child.pp.parent = undefined;
        child.emit(EventType.removed, this);
      }
      children.length = 0;
      this.markDirty(DirtyType.child);
    }
    return this;
  }

  /**
   * 彻底销毁当前节点的所有子节点，释放所有相关资源
   *
   * 与 removeChildren 不同，这是"硬删除"操作，被销毁的子节点无法再使用。
   * 销毁过程是递归的，会同时销毁所有后代节点、脚本、滤镜和事件监听。
   * 适用于确定不再需要子节点的场景，能有效防止内存泄漏。
   *
   * @returns 返回当前节点实例，支持链式调用
   */
  destroyChildren(): this {
    const { children } = this;
    if (children.length) {
      for (let i = children.length - 1; i > -1; i--) {
        children[i].destroy();
      }
      children.length = 0;
      this.markDirty(DirtyType.child);
    }
    return this;
  }

  /**
   * 为当前节点添加视觉滤镜效果
   *
   * 滤镜会改变节点的渲染效果，如模糊、发光、颜色调整等。
   * 多个滤镜会按照添加顺序依次应用，可以组合创建复杂的视觉效果。
   *
   * @param filter 要添加的滤镜实例，如 BlurFilter、GlowFilter 等
   * @returns 返回当前节点实例，支持链式调用
   */
  addFilter<T extends Filter>(filter: T): this {
    if (this.pp.filters === defaultFilters) this.pp.filters = [];
    this.pp.filters.push(filter);
    this.markDirty(DirtyType.filter);
    return this;
  }

  /**
   * 通知渲染系统滤镜参数已发生变化，需要重新渲染
   *
   * 当动态修改滤镜的属性（如模糊半径、颜色值等）后，需要调用此方法
   * 告知渲染系统重新计算滤镜效果。这是一个性能优化机制，避免每次
   * 参数变化都立即重新渲染。
   *
   * @param filter 参数已变化的滤镜实例
   * @returns 返回当前节点实例，支持链式调用
   */
  updateFilter<T extends Filter>(filter: T): this {
    filter._dirty = true;
    this.markDirty(DirtyType.filter);
    return this;
  }

  /**
   * 根据筛选条件查找滤镜实例，用于动态修改滤镜参数
   *
   * 在当前节点的滤镜列表中查找符合条件的滤镜，便于后续修改其属性。
   * 查找优先级为：id > label > Class。找到第一个匹配的滤镜后立即返回。
   *
   * @param options 筛选条件对象
   * @param options.id 滤镜的唯一标识符
   * @param options.label 滤镜的标签名
   * @param options.Class 滤镜的类构造函数，如 BlurFilter
   * @returns 返回匹配的第一个滤镜实例，未找到则返回 undefined
   */
  findFilter<T extends Filter>(options: { id?: string; label?: string; Class?: typeof Filter }): T | undefined {
    const { id, label, Class } = options;
    const { filters } = this.pp;
    for (let i = 0, len = filters.length; i < len; i++) {
      const filter = filters[i];
      if (id && filter.id === id) return filter as T;
      if (label && filter.label === label) return filter as T;
      if (Class && filter instanceof Class) return filter as T;
    }
    return undefined;
  }

  /**
   * 从当前节点移除指定的滤镜效果，但不销毁滤镜实例
   *
   * 移除后该滤镜效果会立即从节点上消失，但滤镜实例仍然存在，
   * 可以重新添加到其他节点或同一节点上继续使用。
   *
   * @param filter 要移除的滤镜实例，如果不存在则忽略
   * @returns 返回当前节点实例，支持链式调用
   */
  removeFilter<T extends Filter>(filter?: T): this {
    if (filter) {
      const index = this.pp.filters.indexOf(filter);
      if (index !== -1) {
        this.pp.filters.splice(index, 1);
        this.markDirty(DirtyType.filter);
      }
    }
    return this;
  }

  /**
   * 彻底销毁当前节点的所有滤镜，释放相关资源
   *
   * 这是一个"硬删除"操作，会彻底销毁所有滤镜实例并释放显存资源。
   * 销毁后的滤镜无法再使用，适用于确定不再需要滤镜效果的场景。
   *
   * @returns 返回当前节点实例，支持链式调用
   */
  destroyFilters(): this {
    const { filters } = this;
    if (filters.length) {
      for (let i = filters.length - 1; i > -1; i--) {
        filters[i].destroy();
      }
      filters.length = 0;
      this.markDirty(DirtyType.filter);
    }
    return this;
  }

  /**
   * 为当前节点添加行为逻辑脚本
   *
   * 脚本用于为节点添加动态行为和交互逻辑，如移动、动画、AI等。
   * 添加后脚本会自动绑定到当前节点，并立即开始执行其生命周期方法。
   * 多个脚本按照添加顺序执行，可以组合实现复杂的行为。
   *
   * @param script 要添加的脚本实例，如 MovementScript、AnimationScript 等
   * @returns 返回当前节点实例，支持链式调用
   */
  addScript<T extends BaseScript>(script: T): this {
    const pp = this.pp;
    if (pp.scripts === defaultScripts) pp.scripts = [];
    pp.scripts.push(script);
    script.target = this;
    return this;
  }

  /**
   * 根据筛选条件查找脚本实例，用于动态控制脚本行为
   *
   * 在当前节点的脚本列表中查找符合条件的脚本，便于后续调用其方法或修改属性。
   * 查找优先级为：id > label > Class。找到第一个匹配的脚本后立即返回。
   *
   * @param options 筛选条件对象
   * @param options.id 脚本的唯一标识符
   * @param options.label 脚本的标签名
   * @param options.Class 脚本的类构造函数，如 MovementScript
   * @returns 返回匹配的第一个脚本实例，未找到则返回 undefined
   */
  findScript<T extends BaseScript>(options: { id?: string; label?: string; Class?: { new (): T } }): T | undefined {
    const { id, label, Class } = options;
    const { scripts } = this.pp;

    for (let i = 0, len = scripts.length; i < len; i++) {
      const script = scripts[i];
      if (id && script.id === id) return script as T;
      if (label && script.label === label) return script as T;
      if (Class && script instanceof Class) return script as T;
    }
    return undefined;
  }

  /**
   * 彻底销毁当前节点的所有脚本，停止所有行为逻辑
   *
   * 这是一个"硬删除"操作，会彻底销毁所有脚本实例并清理相关资源。
   * 销毁后的脚本无法再使用，节点将失去所有脚本提供的行为能力。
   *
   * @returns 返回当前节点实例，支持链式调用
   */
  destroyScripts(): this {
    const { scripts } = this.pp;
    for (let i = scripts.length - 1; i > -1; i--) {
      scripts[i].destroy();
    }
    scripts.length = 0;
    return this;
  }

  /**
   * 获取节点在世界坐标系中的最终缩放值
   *
   * 计算当前节点相对于世界坐标系或指定根节点的实际缩放值，会累积所有父节点的缩放效果。
   * 当节点有多层嵌套且各层都有缩放时，此方法返回的是所有缩放的累积结果。
   * 常用于需要获取物体真实大小、碰撞检测边界计算、UI元素定位等场景。
   *
   * @param root 相对参考节点，指定计算的参考坐标系，传入null或undefined表示相对于舞台根节点
   * @param out 用于存储结果的Point对象，可复用现有对象避免创建新实例，不传则自动创建
   * @returns 包含x和y轴世界缩放值的Point对象，值为所有父节点缩放的累积乘积
   */
  getWorldScale(root?: LikoNode, out?: IPoint): IPoint {
    const scale = out ?? new Point();
    scale.x = this.scale.x;
    scale.y = this.scale.y;
    let parent = this.parent;
    while (parent) {
      scale.x *= parent.scale.x;
      scale.y *= parent.scale.y;

      if (parent === root) break;
      parent = parent.parent;
    }
    return scale;
  }

  /**
   * 获取节点在世界坐标系中的最终旋转角度
   *
   * 计算当前节点相对于世界坐标系或指定根节点的实际旋转角度，会累积所有父节点的旋转效果。
   * 当节点有多层嵌套且各层都有旋转时，此方法返回的是所有旋转角度的累加结果。
   * 常用于计算物体的实际朝向、旋转动画的相对计算、方向性碰撞检测等场景。
   *
   * @param root 相对参考节点，指定计算的参考坐标系，传入null或undefined表示相对于舞台根节点
   * @returns 累积后的旋转角度值，单位为弧度，正值表示顺时针旋转
   */
  getWorldRotation(root?: LikoNode): number {
    let rotation = this.rotation;
    let parent = this.parent;
    while (parent) {
      rotation += parent.rotation;

      if (parent === root) break;
      parent = parent.parent;
    }
    return rotation;
  }

  /**
   * 子类重写此方法来自定义本地边界的计算逻辑
   *
   * 当节点没有显式设置width和height时，引擎会调用此方法让子类定义自己的边界计算方式。
   * 例如Sprite节点会根据纹理大小计算，Text节点会根据文字内容和字体计算，Container节点会根据子节点分布计算。
   * 子类应该在此方法中调用bounds的addFrame、addBounds等方法来设置正确的边界范围。
   *
   * @param _bounds 待填充的边界对象，子类应该修改此对象来设置正确的本地边界
   */
  protected _customLocalBounds(_bounds: Bounds) {}

  /**
   * 获取本地边界（相对于父节点）
   *
   * 计算节点在本地坐标系中的边界矩形，用于碰撞检测、点击测试和布局计算等。
   * 如果节点设置了明确的宽高，则直接使用这些值；否则会根据节点内容计算边界。
   * @remarks
   * 返回值在节点级别复用，如需延迟使用应调用 clone 方法。
   * 当节点的尺寸或子节点发生变化时，会重新计算边界。
   * 子类可以通过重写 _customLocalBounds 方法来自定义边界计算逻辑。
   * @returns 返回本地边界对象
   */
  getLocalBounds(): Bounds {
    const { width, height, localBounds, boundsDirty } = this.pp;

    // 子节点和显示没有变化时，直接返回之前的结果
    if (!boundsDirty) return localBounds;

    localBounds.reset();

    // 如果有宽高，直接返回
    if (width >= 0 && height >= 0) {
      localBounds.addFrame(0, 0, width, height);
      this.pp.boundsDirty = false;
      return localBounds;
    }

    // 自定义 localBounds
    this._customLocalBounds(localBounds);

    // 检查 localBounds 是否有问题
    if (
      localBounds.width <= 0 ||
      localBounds.height <= 0 ||
      localBounds.width === Number.POSITIVE_INFINITY ||
      localBounds.height === Number.POSITIVE_INFINITY
    ) {
      console.warn('localBounds width <=0', this);
      return new Bounds(0, 0, 1, 1);
    }
    this.pp.boundsDirty = false;
    return localBounds;
  }

  /**
   * 获取世界边界，相对于指定根节点
   *
   * 计算节点在世界坐标系（或指定根节点坐标系）中的边界矩形，考虑了所有父节点的变换。
   * 此方法常用于可见性检测、相机裁剪和全局碰撞检测等场景。
   * @remarks
   * 返回值在节点级别复用，如需延迟使用应调用 clone 方法。
   * 此方法会考虑节点的位置、缩放和旋转等变换因素。
   * 与 getWorldRotatingRect 不同，此方法返回的是轴对齐的边界矩形，不考虑旋转角度。
   * @param root - 相对参考节点，为空则默认相对于舞台
   * @returns 返回相对于世界或指定节点的边界对象
   */
  getWorldBounds(root?: LikoNode): Bounds {
    // const hasBounds = NodeCache.gloBounds.has(this);
    const bounds = NodeCache.gloBounds.get(this);
    // 节点没有变化时，直接返回之前的结果
    // if (hasBounds && !this.pp.dirty) return bounds;

    // 获取世界 bounds
    bounds.reset();
    const locBounds = this.getLocalBounds();
    bounds.addFrame(locBounds.x, locBounds.y, locBounds.right, locBounds.bottom, this.worldMatrix);

    // 转换为相对于 root 坐标系
    if (root && root !== this.stage) {
      const p1 = root.worldToLocal(bounds);
      const scale = root.getWorldScale();
      bounds.set(p1.x, p1.y, p1.x + bounds.width / scale.x, p1.y + bounds.height / scale.y);
    }

    return bounds;
  }

  /**
   * 获取世界旋转边界，考虑了旋转角度的精确边界
   *
   * 与 getWorldBounds 不同，此方法返回的是考虑了旋转角度的精确边界矩形，
   * 适用于需要精确碰撞检测或旋转对象交互的场景。
   * @remarks
   * 返回值在节点级别复用，如需延迟使用应调用 clone 方法。
   * @param root - 相对参考节点，为空则默认相对于舞台
   * @returns 返回考虑旋转的边界对象
   */
  getWorldRotatingRect(root?: LikoNode): RotatingRect {
    const rRect = NodeCache.rotatingRect.get(this);
    this.localToWorld(Point.TEMP.set(0, 0), rRect);
    const scale = this.getWorldScale(root, Point.TEMP);
    rRect.width = this.width * scale.x;
    rRect.height = this.height * scale.y;
    rRect.rotation = this.getWorldRotation(root);
    return rRect;
  }

  /**
   * 将本地坐标转换为世界坐标
   *
   * 将节点本地坐标系中的点转换为世界坐标系（或指定根节点坐标系）中的点。
   * 此方法在处理交互、碰撞检测和跨节点操作时非常有用。
   * @remarks
   * 转换过程会考虑节点及其所有父节点的位置、缩放和旋转。
   * 如果指定了 root 参数，则结果将相对于该节点的坐标系。
   * @param position - 相对于当前节点的本地坐标
   * @param out - 输出结果的对象（可选，不提供则创建新对象）
   * @param root - 相对参考节点，为空则默认相对于舞台
   * @returns 返回转换后的世界坐标
   */
  localToWorld<P extends IPoint = Point>(position: IPoint, out?: P, root?: LikoNode): P {
    const result = this.worldMatrix.apply<P>(position, out);
    if (root && root !== this.stage) root.worldToLocal(result, result);
    return result;
  }

  /**
   * 将世界坐标转换为本地坐标
   *
   * 将世界坐标系（或指定根节点坐标系）中的点转换为节点本地坐标系中的点。
   * 此方法常用于处理输入事件、拖放操作和相对定位等场景。
   * @remarks
   * 转换过程会考虑节点及其所有父节点的位置、缩放和旋转的逆变换。
   * 如果指定了 root 参数，则输入坐标将被视为相对于该节点的坐标。
   * 此方法是 localToWorld 的逆操作。
   * @param position - 世界坐标位置
   * @param out - 输出结果的对象（可选，不提供则创建新对象）
   * @param root - 相对参考节点，为空则默认相对于舞台
   * @returns 返回转换后的本地坐标
   */
  worldToLocal<P extends IPoint = Point>(position: IPoint, out?: P, root?: LikoNode): P {
    if (root && root !== this.stage) {
      const result = root.worldMatrix.apply<P>(position, out);
      return this.worldMatrix.applyInverse<P>(result, result);
    }
    return this.worldMatrix.applyInverse<P>(position);
  }

  /**
   * 从JSON数据反序列化节点，完整恢复节点的状态和结构
   *
   * 此方法用于从序列化的JSON数据中恢复节点，会设置节点的所有属性、创建子节点树、添加脚本和滤镜。
   *
   * @param json 包含节点完整信息的数据对象，需要符合INodeData接口规范
   * @returns 返回当前节点实例，支持链式调用和方法串联
   */
  fromJson(json: INodeData): this {
    this.pp.id = json.id;
    this.setProps(json.props);

    const { children } = json;
    if (children) {
      for (const data of children) {
        const child = data.props.editorOnly ? undefined : createNodeInstance(data.type);
        if (child) {
          this.addChild(child);
          child.fromJson(data);
        }
      }
    }

    this.setFilters(json.filters);
    this.setScripts(json.scripts);
    return this;
  }

  /**
   * 批量设置节点属性，支持智能属性映射和事件绑定
   *
   * 遍历属性对象并逐一设置到当前节点上，支持所有公开的节点属性如position、scale、alpha等。
   * 特殊处理以"on"开头的属性（如onClick、onPointerDown），会自动注册为对应的事件监听器。
   * 对于不存在的属性会安全忽略，不会抛出错误，保证数据兼容性。
   * 常用于节点初始化、JSON数据恢复、配置应用等场景。
   *
   * @param props 属性键值对对象，键为属性名，值为要设置的属性值，支持嵌套对象和函数
   * @returns 返回当前节点实例，支持链式调用和方法串联
   */
  setProps(props?: Record<string, unknown>): this {
    if (props) {
      const keys = Object.keys(props);
      for (const key of keys) {
        this._$setProp(key, props[key]);
      }
    }
    return this;
  }

  /**
   * 设置单个属性的内部实现，处理特殊属性类型的转换和绑定
   *
   * 内部方法，负责将单个属性正确设置到节点上，包含事件监听器的自动绑定逻辑。
   * 以"on"开头的函数属性会被转换为事件监听器，事件名为去掉"on"前缀后首字母小写的形式。
   * 只有节点确实存在的属性才会被设置，确保类型安全。
   *
   * @param key 属性名称，支持普通属性和事件属性（on开头）
   * @param value 属性值，可以是任意类型，函数类型的on属性会被转换为事件监听器
   */
  protected _$setProp(key: string, value: unknown): void {
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.charAt(2).toLowerCase() + key.slice(3);
      this.on(eventName, value as () => void, this);
    } else if (key in this) {
      (this as Record<string, unknown>)[key] = value;
    }
  }

  /**
   * 根据数据配置重新设置节点的所有脚本，完全替换现有脚本
   *
   * 先销毁当前节点上的所有脚本实例，然后根据提供的脚本数据重新创建和配置脚本。
   * 每个脚本数据会通过注册系统查找对应的脚本类进行实例化，然后设置脚本属性并绑定到节点。
   * 如果某个脚本类未注册或数据格式错误，会跳过该脚本而不影响其他脚本的创建。
   * 常用于场景加载、节点模板应用、脚本配置动态更新等场景。
   *
   * @param scripts 脚本配置数据数组，每个元素包含脚本类型、属性和元数据信息
   * @returns 返回当前节点实例，支持链式调用和方法串联
   */
  setScripts(scripts?: IScriptData[]): this {
    this.destroyScripts();
    if (scripts) {
      for (const data of scripts) {
        const script = createScript(data);
        if (script) {
          this.addScript(script);
          script.setProps(data.props);
        }
      }
    }
    return this;
  }

  /**
   * 根据数据配置重新设置节点的所有滤镜，完全替换现有滤镜效果
   *
   * 先销毁当前节点上的所有滤镜实例，然后根据提供的滤镜数据重新创建和配置滤镜。
   * 每个滤镜数据会通过注册系统查找对应的滤镜类进行实例化，然后设置滤镜属性并应用到节点。
   * 滤镜会按照数组顺序依次应用，创建复合的视觉效果。如果某个滤镜类未注册，会跳过该滤镜。
   * 常用于视觉效果配置、场景氛围切换、动态效果应用等场景。
   *
   * @param filters 滤镜配置数据数组，每个元素包含滤镜类型、参数和元数据信息
   * @returns 返回当前节点实例，支持链式调用和方法串联
   */
  setFilters(filters?: IFilterData[]): this {
    this.destroyFilters();
    if (filters) {
      for (const data of filters) {
        const filter = createFilterInstance(data.type);
        if (filter) {
          this.addFilter(filter);
          filter.setProps(data.props);
        }
      }
    }
    return this;
  }

  /**
   * 点击测试，判断世界坐标点是否命中当前节点的可交互区域
   *
   * 将世界坐标转换为节点本地坐标，然后检查该点是否落在节点的边界矩形内。
   * 优先使用显式设置的width/height，如果没有则使用getLocalBounds计算的动态边界。
   * 这是指针事件系统的核心方法，用于确定鼠标点击、触摸操作是否作用于该节点。
   * 注意此方法只进行几何计算，不考虑节点的透明度、可见性或是否启用交互。
   *
   * @param point 要检测的世界坐标点，通常来自鼠标位置或触摸位置
   * @returns 如果点在节点边界内返回true，否则返回false
   */
  hitTest(point: IPoint): boolean {
    const locPos = this.worldToLocal(point, Point.TEMP);

    const { width, height } = this.pp;
    if (width >= 0 && height >= 0) {
      return locPos.x >= 0 && locPos.y >= 0 && width >= locPos.x && height >= locPos.y;
    }

    const bounds = this.getLocalBounds();
    return bounds.contains(locPos.x, locPos.y);
  }

  /**
   * 注册事件监听器，为节点添加事件响应能力
   *
   * 当指定类型的事件在节点上触发时，会调用提供的回调函数进行处理。
   * 对于指针类型事件（click、pointerdown、pointermove等），会自动启用节点和父节点链的指针交互功能。
   * 支持多个监听器监听同一事件，按注册顺序依次调用。事件支持从子节点向父节点的冒泡传播。
   * 相同的事件类型、监听器函数和调用者组合只能注册一次，重复注册会覆盖之前的注册。
   *
   * @param type 事件类型名称，如"click"、"pointerdown"、"added"等，不区分大小写
   * @param listener 事件回调函数，接收事件对象和相关参数，函数内的this指向caller参数
   * @param caller 回调函数的执行上下文对象，决定函数内this的指向，通常传入当前对象实例
   * @returns 返回当前节点实例，支持链式调用和方法串联
   */
  on(type: string, listener: (...args: any[]) => void, caller?: any): this {
    if (this.pp.event === defaultEvent) this.pp.event = new Dispatcher();
    if (pointerMap[type] && (!this.pointerEnabled || !this.pointerEnabledForChildren)) {
      this.pointerEnabled = true;
      this.pointerEnabledForChildren = true;
      this._$pointerEnableParent();
    }
    this.pp.event.on(type, listener, caller);
    return this;
  }

  private _$pointerEnableParent() {
    let parent = this.parent;
    while (parent && !parent.pointerEnabledForChildren) {
      parent.pointerEnabledForChildren = true;
      parent = parent.parent;
    }
  }

  /**
   * 注册一次性事件监听器，触发一次后自动销毁
   *
   * 功能与on方法相同，但监听器在第一次触发后会自动从事件系统中移除。
   * 适用于只需要响应一次的事件场景，如初始化完成、资源加载完毕、一次性动画结束等。
   * 同样支持指针事件的自动启用和父节点链的配置。如果事件从未触发，监听器会一直保留。
   * 相同的事件类型、监听器函数和调用者组合只能注册一次。
   *
   * @param type 事件类型名称，如"load"、"complete"、"ready"等，不区分大小写
   * @param listener 事件回调函数，触发一次后会自动移除，函数内的this指向caller参数
   * @param caller 回调函数的执行上下文对象，决定函数内this的指向
   * @returns 返回当前节点实例，支持链式调用和方法串联
   */
  once(type: string, listener: (...args: any[]) => void, caller?: any): this {
    if (this.pp.event === defaultEvent) this.pp.event = new Dispatcher();
    if (pointerMap[type]) {
      this.pointerEnabled = true;
      this.pointerEnabledForChildren = true;
      this._$pointerEnableParent();
    }
    this.pp.event.once(type, listener, caller);
    return this;
  }

  /**
   * 移除指定的事件监听器，精确匹配后删除
   *
   * 根据事件类型、监听器函数和调用者三个参数精确匹配，移除之前通过on或once注册的监听器。
   * 三个参数必须与注册时完全相同才能成功移除，这确保了事件监听器的精确管理。
   * 如果找不到匹配的监听器，调用此方法不会产生任何效果，也不会报错。
   * 移除指针事件监听器不会自动禁用节点的指针交互功能。
   *
   * @param type 事件类型名称，必须与注册时完全一致，不区分大小写
   * @param listener 要移除的回调函数引用，必须是注册时的同一个函数对象
   * @param caller 回调函数的调用者，必须与注册时的caller相同
   * @returns 返回当前节点实例，支持链式调用和方法串联
   */
  off(type: string, listener: (...args: any[]) => void, caller?: any): this {
    if (this.pp.event === defaultEvent) return this;
    this.pp.event.off(type, listener, caller);
    return this;
  }

  /**
   * 批量移除事件监听器，按调用者过滤或全部清除
   *
   * 如果指定了caller参数，会移除该调用者注册的所有事件监听器，不论事件类型。
   * 如果不指定caller参数，会清除当前节点上的所有事件监听器。
   * 这是一个便捷的清理方法，特别适用于组件销毁、对象重置、内存清理等场景。
   * 不会影响子节点或父节点的事件监听器。
   *
   * @param caller 指定要清除的调用者对象，如果为空则清除所有监听器
   * @returns 返回当前节点实例，支持链式调用和方法串联
   */
  offAll(caller?: unknown): this {
    if (this.pp.event === defaultEvent) return this;
    this.pp.event.offAll(caller);
    return this;
  }

  /**
   * 派发事件，触发指定类型的所有监听器
   *
   * 立即触发当前节点上注册的指定类型的所有事件监听器，按照注册顺序依次调用。
   * 可以传递任意数量和类型的参数给监听器函数，这些参数会原样传递给每个监听器。
   * 事件触发是同步的，所有监听器会在此方法返回前全部执行完毕。
   * 某些鼠标事件类型支持向父节点冒泡，具体行为取决于事件系统的设计。
   *
   * @param type 要触发的事件类型名称，不区分大小写
   * @param args 传递给监听器的参数列表，可以是任意数量的任意类型参数
   * @returns 返回当前节点实例，支持链式调用和方法串联
   */
  emit(type: string, ...args: any[]): this {
    if (this.pp.event === defaultEvent) return this;
    this.pp.event.emit(type, ...args);
    return this;
  }

  /**
   * 检查是否存在指定类型的事件监听器
   *
   * 查询当前节点是否注册了指定类型的事件监听器，返回布尔值表示存在性。
   * 此方法常用于条件判断，避免不必要的事件派发，提升性能。
   * 只检查当前节点，不会检查父节点或子节点的监听器。
   *
   * @param type 要检查的事件类型名称，不区分大小写
   * @returns 如果存在至少一个该类型的监听器返回true，否则返回false
   */
  hasListener(type: string): boolean {
    if (this.pp.event === defaultEvent) return false;
    return this.pp.event.hasListener(type);
  }
}
