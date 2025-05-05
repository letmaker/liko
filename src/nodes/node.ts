import { DEG_TO_RAD, DirtyType, EventType, RAD_TO_DEG } from "../const";
import type { LikoPointerEvent } from "../events/pointer-event";
import { Bounds } from "../math/bounds";
import { Matrix } from "../math/matrix";
import { ObservablePoint } from "../math/observable-point";
import { type IPoint, Point } from "../math/point";
import type { RotatingRect } from "../math/rotating-rect";
import { Transform } from "../math/transform";
import type { Filter } from "../render/filter/filter";
import { NodeCache } from "../render/utils/node-cache";
import type { ScriptBase } from "../scripts/script-base";
import { Color, type ColorData } from "../utils/color";
import { Dispatcher } from "../utils/dispatcher";
import { createFilterInstance, createNodeInstance } from "../utils/register";
import { createScript, getUID } from "../utils/utils";
import type { IScene } from "./scene";
import type { Stage } from "./stage";

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
const defaultScripts: ScriptBase[] = [];
const defaultEvent = new Dispatcher();

export interface INodePrivateProps {
  id: string;
  userData: Record<string, any>;
  event: Dispatcher;
  children: LikoNode[];
  filters: Filter[];
  scripts: ScriptBase[];
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
  scripts?: ScriptBase[];

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
 * 提供了节点树结构、事件系统、变换系统等基础功能
 */
export abstract class LikoNode {
  /** @private 私有属性集合，可以读取但不应直接修改 */
  pp: INodePrivateProps = {
    id: "",
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
  };

  /** 是否启用节点，设为 false 时节点不可用且脚本不执行，而 visible 只影响显示 */
  enabled = true;
  /** 节点标签名称，用于快速查找和识别节点 */
  label = "";
  /** 是否缓存为静态渲染，对有大量不变子节点的容器可提升渲染效率 */
  cacheEnabled = false;
  /**
   * 是否支持鼠标事件，默认不支持，添加鼠标事件监听后会自动启用
   * 当父节点 pointerEnabled=true 时，会优先判断父节点命中后再判定子节点，以提高性能
   */
  pointerEnabled = false;
  /**
   * 是否支持子节点鼠标事件判定，添加鼠标事件监听后会自动启用
   * 当节点 pointerEnabled=false 但 pointerEnabledForChildren=true 时，仍会尝试命中子节点并冒泡
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

  /** 舞台节点引用，只有被添加到舞台后此属性才有值 */
  get stage(): Stage | undefined {
    return this.pp.stage;
  }

  /** 场景节点引用，只有被添加到场景后此属性才有值（建议缓存为局部变量以减少遍历开销） */
  get scene(): IScene | undefined {
    // TODO 这里看看是不是继续递归？还是类似 stage 一样，存储起来
    return this.pp.parent?.scene;
  }

  /** 父节点引用，只有被添加到父节点内此属性才有值 */
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

  /** 子节点列表，可直接读取但不应直接修改此数组 */
  get children(): LikoNode[] {
    return this.pp.children;
  }

  /** 滤镜列表，可直接读取但不应直接修改此数组 */
  get filters(): Filter[] {
    return this.pp.filters;
  }

  /** 脚本列表，可直接读取但不应直接修改此数组 */
  get scripts(): ScriptBase[] {
    return this.pp.scripts;
  }
  set scripts(value: ScriptBase[]) {
    this.destroyScripts();
    for (const script of value) {
      this.addScript(script);
    }
  }

  /** 自定义数据，用于存储额外信息，如 `node.userData.speed = 1` */
  get userData(): Record<string, any> {
    if (this.pp.userData === defaultData) this.pp.userData = {};
    return this.pp.userData;
  }
  set userData(value: Record<string, any>) {
    this.pp.userData = value;
  }

  /** 节点 id，作为节点的唯一标识符 */
  get id(): string {
    if (!this.pp.id) this.pp.id = getUID();
    return this.pp.id;
  }
  set id(value: string) {
    if (this.pp.id !== value) {
      this.pp.id = value;
    }
  }

  /** 是否可见，不可见时不会被渲染 */
  get visible() {
    return this.pp.visible && this.enabled;
  }
  set visible(value) {
    if (this.pp.visible !== value) {
      this.pp.visible = value;
      this.markDirty(DirtyType.child);
    }
  }

  /** 节点宽度，单位为像素 */
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

  /** 节点高度，单位为像素 */
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

  /** 节点位置坐标，相对于父节点的坐标系 */
  get position(): ObservablePoint {
    return this.pp.position;
  }
  set position(value: IPoint) {
    this.pp.position.copyFrom(value);
  }

  /** 节点缩放比率，1.0 表示原始大小 */
  get scale(): ObservablePoint {
    return this.transform.scale;
  }
  set scale(value: IPoint) {
    this.transform.scale.copyFrom(value);
  }

  /** 节点旋转弧度，以弧度为单位 */
  get rotation(): number {
    return this.transform.rotation;
  }
  set rotation(value: number) {
    this.transform.rotation = value;
  }

  /** 节点旋转角度，底层仍使用 rotation（弧度）存储 */
  get angle(): number {
    return this.transform.rotation * RAD_TO_DEG;
  }
  set angle(value: number) {
    this.transform.rotation = value * DEG_TO_RAD;
  }

  /** 节点轴心点，影响节点旋转和缩放的中心点（只读） */
  get pivot(): IPoint {
    return this.transform.pivot;
  }

  /** 节点锚点，以宽高的百分比表示，如 0.5 表示中心点 */
  get anchor(): ObservablePoint {
    return this.pp.anchor;
  }
  set anchor(value: IPoint) {
    this.pp.anchor.copyFrom(value);

    const { pivot } = this.transform;
    const { width, height } = this.getLocalBounds();
    pivot.x = width * value.x;
    pivot.y = height * value.y;
    this.markDirty(DirtyType.transform);
  }

  /** 节点叠加颜色，用于调整节点的颜色 */
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

  /** 节点透明度，范围 0-1，0 表示完全透明 */
  get alpha(): number {
    return this.pp.alpha;
  }
  set alpha(value: number) {
    if (this.pp.alpha !== value) {
      this.pp.alpha = value;
      this.markDirty(DirtyType.color);
    }
  }

  /** 节点世界透明度，考虑了父节点透明度的最终透明度 */
  get worldAlpha(): number {
    return this.pp.tintColor.alpha;
  }

  /** 节点变换对象，管理位置、旋转、缩放等变换属性 */
  get transform() {
    if (this.pp.transform === defaultTF) {
      this.pp.transform = new Transform({ observer: this });
    }
    return this.pp.transform;
  }

  /** 本地矩阵，相对于父节点的变换矩阵 */
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

  /** 世界矩阵，相对于舞台的变换矩阵 */
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
   * 当节点发生变化后，标记为脏状态以便在下一帧更新
   * @param type - 脏标记类型，指示哪种属性发生了变化
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
        // 父节点标脏
        return this._$dirtyParent(type);
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
   * 修改子节点在子节点列表中的索引位置
   * @param child - 要修改索引的子节点
   * @param index - 新的索引位置
   * @returns 当前节点实例，支持链式调用
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
   * 根据筛选条件查找子节点
   *
   * 在当前节点的子节点中查找符合指定条件的节点，支持按 ID、标签或类型查找。
   * 可以选择是否递归查找所有后代节点。
   *
   * @param options - 筛选条件，可包含 id、label、Class 和 deep 选项
   * @returns 返回匹配的子节点，如果未找到则返回 undefined
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
   * 从当前节点中删除指定的子节点
   *
   * 将指定的子节点从当前节点的子节点列表中移除，但不会销毁该子节点。
   * 移除后，子节点的 parent 和 stage 引用会被清除，并触发 removed 事件。
   *
   * @param child - 要删除的子节点
   * @returns 当前节点实例，支持链式调用
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
   * 将当前节点从其父节点中移除
   *
   * 从父节点的子节点列表中移除当前节点，但不会销毁当前节点。
   * 即使没有被添加到父节点，调用此方法也不会报错。
   *
   * @returns 当前节点实例，支持链式调用
   */
  removeSelf(): this {
    if (this.pp.parent) this.pp.parent.removeChild(this);
    return this;
  }

  /**
   * 删除当前节点的所有子节点
   *
   * 将所有子节点从当前节点的子节点列表中移除，但不会销毁这些子节点。
   * 子节点会被从节点树中移除，可以被重新添加到其他节点中。
   * 所有被移除的子节点会触发 removed 事件。
   *
   * @returns 当前节点实例，支持链式调用
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
   * 销毁当前节点的所有子节点
   *
   * 与 removeChildren 不同，此方法会彻底销毁子节点，销毁后子节点不可再用。
   * 销毁过程会递归处理所有子节点，清理所有资源和事件监听。
   *
   * @returns 当前节点实例，支持链式调用
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
   * 添加滤镜到当前节点
   *
   * 将指定的滤镜实例添加到当前节点，使节点在渲染时应用该滤镜效果。
   * @param filter - 要添加的滤镜实例
   * @returns 当前节点实例，支持链式调用
   */
  addFilter<T extends Filter>(filter: T): this {
    if (this.pp.filters === defaultFilters) this.pp.filters = [];
    this.pp.filters.push(filter);
    this.markDirty(DirtyType.filter);
    return this;
  }

  /**
   * 更新滤镜状态，当滤镜参数变化时调用
   *
   * 当滤镜的参数发生变化时，应调用此方法以确保变化生效。
   * @param filter - 要更新的滤镜实例
   * @returns 当前节点实例，支持链式调用
   */
  updateFilter<T extends Filter>(filter: T): this {
    filter._dirty = true;
    this.markDirty(DirtyType.filter);
    return this;
  }

  /**
   * 根据筛选条件查找滤镜实例
   *
   * 在当前节点的滤镜列表中查找符合指定条件的滤镜实例。
   * 支持按 ID、标签或类型查找。
   * @param options - 筛选条件，可包含 id、label 和 Class 选项
   * @returns 返回匹配的滤镜实例，如果未找到则返回 undefined
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
   * 从当前节点移除指定的滤镜
   *
   * 将指定的滤镜实例从当前节点的滤镜列表中移除，但不会销毁该滤镜。
   * @param filter - 要移除的滤镜实例
   * @returns 当前节点实例，支持链式调用
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
   * 销毁当前节点的所有滤镜
   *
   * 彻底销毁当前节点的所有滤镜实例，销毁后滤镜不可再用。
   * @returns 当前节点实例，支持链式调用
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
   * 添加脚本到当前节点
   *
   * 将指定的脚本实例添加到当前节点，并设置脚本的目标节点为当前节点。
   * 添加后脚本会自动执行其生命周期方法（onCreate 等）。
   * @param script - 要添加的脚本实例
   * @returns 当前节点实例，支持链式调用
   */
  addScript<T extends ScriptBase>(script: T): this {
    const pp = this.pp;
    if (pp.scripts === defaultScripts) pp.scripts = [];
    pp.scripts.push(script);
    script.target = this;
    return this;
  }

  /**
   * 根据筛选条件查找脚本实例
   *
   * 在当前节点的脚本列表中查找符合指定条件的脚本实例。
   * 支持按 ID、标签或类型查找。
   * @param options - 筛选条件，可包含 id、label 和 Class 选项
   * @returns 返回匹配的脚本实例，如果未找到则返回 undefined
   */
  findScript<T extends ScriptBase>(options: { id?: string; label?: string; Class?: typeof ScriptBase }): T | undefined {
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
   * 销毁当前节点的所有脚本
   * 销毁后脚本不可再用
   * @returns 当前节点实例，支持链式调用
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
   * 获取世界缩放值（考虑所有父节点的缩放）
   * @param root - 相对参考节点，为空则默认相对于舞台
   * @param out - 输出结果的对象（可选，不提供则创建新对象）
   * @returns 返回世界缩放值
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
   * 获取世界旋转值（考虑所有父节点的旋转）
   * @param root - 相对参考节点，为空则默认相对于舞台
   * @returns 返回世界旋转值，单位为弧度
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
   * 自定义本地边界计算方法
   * @param _bounds - 要填充的边界对象
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
    const { dirty, width, height, localBounds } = this.pp;

    // 子节点和显示没有变化时，直接返回之前的结果
    if ((dirty & DirtyType.size) === 0 && (dirty & DirtyType.child) === 0) return localBounds;

    localBounds.reset();

    // 如果有宽高，直接返回
    if (width >= 0 && height >= 0) {
      localBounds.addFrame(0, 0, width, height);
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
      console.warn("localBounds width <=0", this);
    }
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
   * 从 JSON 数据创建或更新节点
   * @param json - 节点的 JSON 数据
   * @returns 返回当前节点实例，支持链式调用
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
   * 根据 JSON 数据设置节点属性
   *
   * 批量设置节点的属性值，支持设置任何节点的公开属性。
   * 特别地，对于以 "on" 开头的属性（如 onClick），会自动注册为事件监听器。
   * @remarks
   * 此方法通常用于从序列化数据恢复节点状态，或在创建节点时批量设置属性。
   * 对于不存在的属性，会被忽略而不会报错。
   * @param props - 属性数据对象，键为属性名，值为属性值
   * @returns 返回当前节点实例，支持链式调用
   */
  setProps(props?: Record<string, unknown>): this {
    if (props) {
      const keys = Object.keys(props);
      for (const key of keys) {
        if (key.startsWith("on") && typeof props[key] === "function") {
          const eventName = key.charAt(2).toLowerCase() + key.slice(3);
          this.on(eventName, props[key] as () => void, this);
        } else if (key in this) {
          (this as Record<string, unknown>)[key] = props[key];
        }
      }
    }
    return this;
  }

  /**
   * 通过脚本数据列表重置节点的脚本
   *
   * 会先清除现有脚本，然后根据数据创建新脚本。
   * 此方法通常用于从序列化数据恢复节点的脚本状态。
   * @remarks
   * 脚本创建过程会使用注册系统查找对应的脚本类，并实例化。
   * 创建后会自动设置脚本的属性，并将脚本添加到节点。
   * @param scripts - 脚本数据列表
   * @returns 当前节点实例，支持链式调用
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
   * 通过滤镜数据列表重置节点的滤镜
   *
   * 会先清除现有滤镜，然后根据数据创建新滤镜。
   * 此方法通常用于从序列化数据恢复节点的滤镜效果。
   * @remarks
   * 滤镜创建过程会使用注册系统查找对应的滤镜类，并实例化。
   * 创建后会自动设置滤镜的属性，并将滤镜添加到节点。
   * @param filters - 滤镜数据列表
   * @returns 当前节点实例，支持链式调用
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
   * 检测指定点是否在节点内部
   *
   * 判断世界坐标系中的点是否位于节点的可见区域内，用于鼠标交互和碰撞检测。
   * 首先将世界坐标转换为节点的本地坐标，然后检查是否在节点的边界内。
   * @remarks
   * 如果节点设置了明确的宽高，则使用这些值进行判断；
   * 否则会使用 getLocalBounds 计算的边界进行判断。
   * 此方法不考虑节点的透明度和可见性，只进行几何判断。
   * @param point - 要检测的点（世界坐标）
   * @returns 如果点在节点内部则返回 true，否则返回 false
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
   * 注册事件监听器
   *
   * 为节点添加事件监听器，当指定类型的事件触发时，会调用提供的回调函数。
   * 如果注册的是指针事件（如 click、pointerdown 等），会自动启用节点的指针交互功能。
   * @remarks
   * 对同一事件类型、监听器和调用者，多次注册只会生效最后一次。
   * 事件系统支持冒泡机制，子节点触发的事件会向上传递到父节点。
   * @param type - 事件类型，不区分大小写
   * @param listener - 事件触发时的回调函数
   * @param caller - 回调函数的调用者，通常为 this
   * @returns 当前节点实例，支持链式调用
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
   * 注册一次性事件监听器，事件触发一次后自动移除
   *
   * 与 on 方法类似，但监听器只会被触发一次，之后会自动移除。
   * 这对于只需要响应一次的事件（如初始化完成、资源加载等）非常有用。
   * @remarks
   * 对同一事件类型、监听器和调用者，多次注册只会生效最后一次。
   * 如果注册的是指针事件，会自动启用节点的指针交互功能。
   * @param type - 事件类型，不区分大小写
   * @param listener - 事件触发时的回调函数
   * @param caller - 回调函数的调用者，通常为 this
   * @returns 当前节点实例，支持链式调用
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
   * 移除事件监听器
   *
   * 移除之前通过 on 或 once 方法注册的事件监听器。需要提供完全相同的参数才能成功移除。
   * @param type - 事件类型，不区分大小写
   * @param listener - 要移除的回调函数
   * @param caller - 回调函数的调用者
   * @returns 当前节点实例，支持链式调用
   */
  off(type: string, listener: (...args: any[]) => void, caller?: any): this {
    if (this.pp.event === defaultEvent) return this;
    this.pp.event.off(type, listener, caller);
    return this;
  }

  /**
   * 移除特定调用者的所有事件监听器
   *
   * 一次性移除特定调用者注册的所有事件监听器，或在不指定调用者时移除所有监听器。
   * 这在组件销毁或重置时特别有用。
   * @param caller - 调用者对象，如果为空则移除所有事件监听器
   * @returns 当前节点实例，支持链式调用
   */
  offAll(caller?: unknown): this {
    if (this.pp.event === defaultEvent) return this;
    this.pp.event.offAll(caller);
    return this;
  }

  /**
   * 派发事件
   *
   * 触发指定类型的事件，并将参数传递给所有注册的监听器。
   * 事件会按照注册顺序依次调用监听器，并支持传递任意数量的参数。
   * 事件会在当前节点触发，并根据事件类型可能会向上冒泡到父节点。
   * @param type - 事件类型，不区分大小写
   * @param args - 传递给监听器的参数，支持多个参数
   * @returns 当前节点实例，支持链式调用
   */
  emit(type: string, ...args: any[]): this {
    if (this.pp.event === defaultEvent) return this;
    this.pp.event.emit(type, ...args);
    return this;
  }

  /**
   * 检查是否存在指定类型的事件监听器
   *
   * 判断当前节点是否注册了指定类型的事件监听器，用于条件判断和性能优化。
   * @param type - 事件类型，不区分大小写
   * @returns 如果存在监听器则返回 true，否则返回 false
   */
  hasListener(type: string): boolean {
    if (this.pp.event === defaultEvent) return false;
    return this.pp.event.hasListener(type);
  }
}
