import { DEG_TO_RAD, DirtyType, EventType, RAD_TO_DEG } from "../const";
import type { Bounds } from "../math/bounds";
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

/** 节点数据接口 */
export interface INodeData {
  /** 节点 id，是节点的唯一标识，一般由编辑器指定  */
  id: string;
  /** 节点类型，一般由编辑器指定 */
  type: string;
  /** 节点描述，方便 AI 读取 */
  description?: string;
  /** 节点属性 */
  props: {
    label?: string;
    enabled?: boolean;
    editorOnly?: boolean;
    pos?: IPoint;
    scale?: IPoint;
    anchor?: IPoint;
    rotation?: number;
    angle?: number;
    width?: number;
    height?: number;
    alpha?: number;
    visible?: boolean;
    mouseEnable?: boolean;
    mouseEnableChildren?: boolean;
    [key: string]: unknown;
  };
  /** 子节点列表 */
  children?: INodeData[];
  /** 滤镜列表 */
  filters?: IFilterData[];
  /** 脚本列表 */
  scripts?: IScriptData[];
}

/** 脚本数据接口 */
export interface IScriptData {
  id: string;
  type: "Script" | "Effect" | "Controller";
  /** 脚本描述，方便 AI 读取 */
  description?: string;
  props: {
    script: string;
    label?: string;
    enabled?: boolean;
    time?: number;
    duration?: number;
    [key: string]: any;
  };
}

/** 滤镜数据接口 */
export interface IFilterData {
  id: string;
  type: string;
  /** 滤镜描述，方便 AI 读取 */
  description?: string;
  props: {
    [key: string]: unknown;
  };
}

const mouseMap: Record<string, boolean> = {
  mousedown: true,
  mouseup: true,
  mousemove: true,
  mouseover: true,
  mouseout: true,
  mouseupoutside: true,
  click: true,
};

const defaultTF = new Transform();
const defaultData: Record<string, any> = {};
const defaultChildren: Node[] = [];
const defaultFilters: Filter[] = [];
const defaultScripts: ScriptBase[] = [];
const defaultEvent = new Dispatcher();

export interface INodePrivateProps {
  id: string;
  data: Record<string, any>;
  event: Dispatcher;
  children: Node[];
  filters: Filter[];
  scripts: ScriptBase[];
  transform: Transform;
  color: Color;
  alpha: number;
  localMatrix: Matrix;
  worldMatrix: Matrix;
  pos: ObservablePoint;
  anchor: ObservablePoint;
  width: number;
  height: number;
  visible: boolean;
  destroyed: boolean;
  dirty: number;
  stage?: Stage;
  parent?: Node;
}

export interface INodeOptions {
  id?: string;
  label?: string;
  pos?: IPoint;
  scale?: IPoint;
  anchor?: IPoint;
  rotation?: number;
  angle?: number;
  width?: number;
  height?: number;
  alpha?: number;
  visible?: boolean;
  mouseEnable?: boolean;
  mouseEnableChildren?: boolean;
  data?: Record<string, any>;
  parent?: Node;
}

/**
 * 节点 = transform + children + filters + scripts
 */
export abstract class Node {
  /** @private 私有变量，可以读取，但尽量不要直接修改 */
  pp: INodePrivateProps = {
    id: "",
    data: defaultData,
    event: defaultEvent,
    children: defaultChildren,
    filters: defaultFilters,
    scripts: defaultScripts,
    transform: defaultTF,
    color: Color.Default,
    alpha: 1,
    localMatrix: new Matrix(),
    worldMatrix: new Matrix(),
    pos: new ObservablePoint(this),
    anchor: new ObservablePoint(this),
    /** -1代表通过 getLocalBounds 获得宽 */
    width: -1,
    /** -1代表通过 getLocalBounds 获得高 */
    height: -1,
    visible: true,
    destroyed: false,
    dirty: DirtyType.transform | DirtyType.size | DirtyType.texture | DirtyType.color,
    stage: undefined,
    parent: undefined,
  };

  /** 是否启用节点，如果设置为 false，则节点不可用，并且脚本也不执行，相比 visible 只影响其显示 @default true */
  enabled = true;
  /** 节点标签名称 @default "" */
  label = "";
  /** 是否缓存为静态渲染，对具有大量不变子节点的容器，缓存能能提升渲染效率 @default false */
  cache = false;
  /**
   * 是否支持鼠标事件，默认不支持，增加鼠标事件监听后，会自动打开为支持。
   * 如果父节点 mouseEnable=true，则会优先判断父节点命中后，才再次判定子节点，以节省性能
   * @default false
   */
  mouseEnable = false;
  /**
   * 是否支持子节点鼠标事件判定，增加鼠标事件监听后，会自动打开为支持。
   * 如果节点 mouseEnable=false，但 mouseEnableChildren=true，则依然尝试命中子节点，然后冒泡
   * @default false
   */
  mouseEnableChildren = false;

  constructor(options?: INodeOptions) {
    if (options) this.setProps(options as Record<string, any>);
  }

  /**
   * 销毁此节点及所有子节点，销毁后此节点则不可再用
   * 节点被销毁时，所有子节点、脚本、滤镜、node|root|scene|stage|stage.timer 的监听都会被自动取消
   */
  destroy(): void {
    if (!this.pp.destroyed) {
      this.pp.destroyed = true;
      this.enabled = false;
      this.destroyScripts();
      this.destroyFilters();
      this.destroyChildren();
      this.offAll();
      this.scene?.offAll(this);
      this.stage?.offAll(this);
      this.stage?.timer.clearAll(this);
      this.removeSelf();
    }
  }

  /** 是否被销毁，销毁后则不可再用 */
  get destroyed(): boolean {
    return this.pp.destroyed;
  }

  /** 舞台节点引用，只有被添加到舞台后，此属性才有值 */
  get stage(): Stage | undefined {
    return this.pp.stage;
  }

  /** 场景节点引用，只有被添加到场景后，此属性才有值（使用时尽量引用成局部变量，减少遍历获取） */
  get scene(): IScene | undefined {
    // TODO 这里看看是不是继续递归？还是类似 stage 一样，存储起来
    if (this.pp.parent) return this.pp.parent.scene;
    return undefined;
  }

  /** 父节点引用，只有被添加到父节点内，此属性才有值 */
  get parent(): Node | undefined {
    return this.pp.parent;
  }
  set parent(value: Node | undefined) {
    if (value) {
      value.addChild(this);
    } else {
      this.removeSelf();
    }
  }

  /** 子节点列表，请勿直接修改此数组，但可以直接读取 */
  get children(): Node[] {
    return this.pp.children;
  }

  /** 滤镜列表，请勿直接修改此数组，但可以直接读取 */
  get filters(): Filter[] {
    return this.pp.filters;
  }

  /** 脚本列表，请勿直接修改此数组，但可以直接读取 */
  get scripts(): ScriptBase[] {
    return this.pp.scripts;
  }

  /** 自定义数据，比如 `node.data.speed = 1` */
  get data(): Record<string, any> {
    if (this.pp.data === defaultData) this.pp.data = {};
    return this.pp.data;
  }
  set data(value: Record<string, any>) {
    const newData = { ...value };
    this.pp.data = newData;
  }

  /** 节点 id，是节点的唯一标识 */
  get id(): string {
    if (!this.pp.id) this.pp.id = getUID();
    return this.pp.id;
  }
  set id(value: string) {
    if (this.pp.id !== value) {
      this.pp.id = value;
    }
  }

  /** 是否可见，不可见则不渲染 */
  get visible() {
    return this.pp.visible && this.enabled;
  }
  set visible(value) {
    if (this.pp.visible !== value) {
      this.pp.visible = value;
      this.onDirty(DirtyType.child);
    }
  }

  /** 节点宽度 */
  get width(): number {
    if (this.pp.width >= 0) return this.pp.width;
    return this.getLocalBounds().width;
  }
  set width(value: number) {
    const pp = this.pp;
    if (pp.width !== value) {
      pp.width = value;
      this.getTransform().pivot.x = value * pp.anchor.x;
      this.emit(EventType.resize);
      this.onDirty(DirtyType.size);
    }
  }

  /** 节点高度 */
  get height(): number {
    if (this.pp.height >= 0) return this.pp.height;
    return this.getLocalBounds().height;
  }
  set height(value: number) {
    const pp = this.pp;
    if (pp.height !== value) {
      pp.height = value;
      this.getTransform().pivot.y = value * pp.anchor.y;
      this.emit(EventType.resize);
      this.onDirty(DirtyType.size);
    }
  }

  /** 节点位置坐标 */
  get pos(): ObservablePoint {
    return this.pp.pos;
  }
  set pos(value: IPoint) {
    this.pp.pos.copyFrom(value);
  }

  /** 节点缩放比率 */
  get scale(): ObservablePoint {
    return this.getTransform().scale;
  }
  set scale(value: IPoint) {
    this.getTransform().scale.copyFrom(value);
  }

  /** 节点旋转弧度 */
  get rotation(): number {
    return this.getTransform().rotation;
  }
  set rotation(value: number) {
    this.getTransform().rotation = value;
  }

  /** 节点旋转角度，底层数据还是 rotation */
  get angle(): number {
    return this.getTransform().rotation * RAD_TO_DEG;
  }
  set angle(value: number) {
    this.getTransform().rotation = value * DEG_TO_RAD;
  }

  /** 【只读】节点轴心点，此值影响节点旋转和缩放的中心 */
  get pivot(): IPoint {
    return this.getTransform().pivot;
  }

  /** 节点轴心点，此值为相比宽高的百分比，比如 0.5，为图片的中心 */
  get anchor(): ObservablePoint {
    return this.pp.anchor;
  }
  set anchor(value: IPoint) {
    const pp = this.pp;
    pp.anchor.copyFrom(value);

    const { pivot } = this.getTransform();
    if (pp.width !== -1) {
      pivot.x = pp.width * value.x;
    }
    if (pp.height !== -1) {
      pivot.y = pp.height * value.y;
    }
  }

  /** 节点叠加颜色 */
  get tint(): ColorData {
    return this.pp.color.value;
  }
  set tint(value: ColorData) {
    const pp = this.pp;
    if (pp.color.value !== value) {
      if (pp.color === Color.Default) pp.color = new Color(value);
      pp.color.value = value;
      this.onDirty(DirtyType.color);
    }
  }

  /** 节点世界透明度 */
  get worldAlpha(): number {
    return this.pp.color.alpha;
  }

  /** 节点透明度 */
  get alpha(): number {
    return this.pp.alpha;
  }
  set alpha(value: number) {
    if (this.pp.alpha !== value) {
      this.pp.alpha = value;
      this.onDirty(DirtyType.color);
    }
  }

  /** 节点变换 */
  getTransform() {
    if (this.pp.transform === defaultTF) {
      this.pp.transform = new Transform({ observer: this });
    }
    return this.pp.transform;
  }

  /** 本地矩阵（相对于 parent） */
  get localMatrix() {
    const pp = this.pp;
    // 矩阵发生变化时，才重新计算矩阵
    if (pp.dirty & DirtyType.transform) {
      return pp.transform.getMatrix(pp.localMatrix, pp.pos);
    }
    return pp.localMatrix;
  }
  set localMatrix(value) {
    const { pos, scale, rotation } = value.decompose(this.pp.transform);
    this.pos = pos;
    this.scale = scale;
    this.rotation = rotation;
  }

  /** 世界矩阵（相对于 stage） */
  get worldMatrix() {
    const pp = this.pp;
    // 矩阵发生变化时，才重新计算世界矩阵
    if (pp.dirty & DirtyType.transform) {
      const parentWorldMatrix = this._$getParentWorldMatrix(this, pp.worldMatrix.identity());
      parentWorldMatrix.append(this.localMatrix);
    }
    return pp.worldMatrix;
  }

  private _$getParentWorldMatrix(target: Node, parentTransform: Matrix) {
    const parent = target.parent;

    if (parent) {
      this._$getParentWorldMatrix(parent, parentTransform);
      parentTransform.append(parent.localMatrix);
    }

    return parentTransform;
  }

  /**
   * 当节点发生变化后，则调用此函数标脏
   */
  onDirty(type: DirtyType) {
    const pp = this.pp;
    if ((pp.dirty & type) === 0) {
      pp.dirty |= type;
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

  // 子节点影响父节点
  private _$dirtyParent(type: DirtyType) {
    const parent = this.parent;
    if (parent && (parent.pp.dirty & type) === 0) {
      parent.pp.dirty |= type;
      parent._$dirtyParent(type);
    }
  }

  // 父节点影响子节点
  private _$dirtyChildren(type: DirtyType) {
    for (const child of this.children) {
      if ((child.pp.dirty & type) === 0) {
        child.pp.dirty |= type;
        child.children.length && child._$dirtyChildren(type);
      }
    }
  }

  /**
   * 添加子节点
   * @param child 子节点
   * @param index 指定索引位置（可选）
   * @returns 返回被添加的子节点
   */
  addChild<T extends Node>(child: T, index?: number): T {
    const pp = this.pp;
    if (pp.children === defaultChildren) pp.children = [];
    child.removeSelf();
    child.pp.parent = this;
    if (index !== undefined) pp.children.splice(index, 0, child);
    else pp.children.push(child);
    if (pp.stage) this._$addToStage(child, pp.stage);
    child.emit(EventType.added, this);
    this.onDirty(DirtyType.child);
    return child;
  }

  private _$addToStage(child: Node, stage: Stage) {
    child.pp.stage = stage;
    child.emit(EventType.addToStage, stage);
    for (const node of child.children) {
      this._$addToStage(node, stage);
    }
  }

  /**
   * 找到自己在父节点的索引顺序
   * @returns 返回自己在父节点的索引顺序
   */
  getIndexOrder(): number {
    if (this.parent) return this.parent.children.indexOf(this);
    return -1;
  }

  /**
   * 修改子节点索引
   * @param child 子节点
   * @param index 新的索引位置
   */
  setChildIndex(child: Node, index: number): void {
    const children = this.children;
    if (index < 0 || index >= children.length) {
      throw new Error(`The index ${index} is out of bounds`);
    }
    const currentIndex = child.getIndexOrder();
    children.splice(currentIndex, 1);
    children.splice(index, 0, child);
    this.onDirty(DirtyType.child);
  }

  /**
   * 根据筛选器获得子节点实例，获取后尽量缓存，不要频繁获取
   * @returns 返回查找到的子节点
   */
  getChild<T extends Node>(options: { id?: string; label?: string; Class?: typeof Node; deep?: boolean }):
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
        const child = children[i].getChild(options);
        if (child) return child as T;
      }
    }
    return undefined;
  }

  /**
   * 删除子节点
   * @param child 子节点
   * @returns 返回被删除的子节点
   */
  removeChild<T extends Node>(child?: T) {
    if (child) {
      const index = this.pp.children.indexOf(child);
      if (index !== -1) {
        child.pp.parent = undefined;
        child.pp.stage = undefined;
        this.pp.children.splice(index, 1);
        child.emit(EventType.removed, this);
        this.onDirty(DirtyType.child);
      }
    }
    return child;
  }

  /**
   * 删除自己，即使没有被添加到节点，也不会报错
   */
  removeSelf(): void {
    if (this.pp.parent) this.pp.parent.removeChild(this);
  }

  /**
   * 删除所有子节点
   */
  removeChildren(): void {
    const { children } = this;
    if (children.length) {
      for (const child of children) {
        child.pp.parent = undefined;
        child.emit(EventType.removed, this);
      }
      children.length = 0;
      this.onDirty(DirtyType.child);
    }
  }

  /**
   * 销毁所有子节点，销毁后不可再用
   */
  destroyChildren(): void {
    const { children } = this;
    if (children.length) {
      for (let i = children.length - 1; i > -1; i--) {
        children[i].destroy();
      }
      children.length = 0;
      this.onDirty(DirtyType.child);
    }
  }

  /**
   * 添加滤镜
   * @param filter 滤镜
   * @returns 返回被添加的滤镜
   */
  addFilter<T extends Filter>(filter: T): T {
    if (this.pp.filters === defaultFilters) this.pp.filters = [];
    this.pp.filters.push(filter);
    this.onDirty(DirtyType.filter);
    return filter;
  }

  /**
   * 更新滤镜，当更新滤镜参数时调用
   * @param filter 滤镜
   * @returns 返回更新的滤镜
   */
  updateFilter<T extends Filter>(filter: T): T {
    filter._dirty = true;
    this.onDirty(DirtyType.filter);
    return filter;
  }

  /**
   * 根据筛选器获取滤镜实例，获取后尽量缓存，不要频繁获取
   * @returns 返回匹配的滤镜实例
   */
  getFilter<T extends Filter>(options: { id?: string; label?: string; Class?: typeof Filter }): T | undefined {
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
   * 删除滤镜
   * @param filter 滤镜
   * @returns 返回被删除的滤镜
   */
  removeFilter<T extends Filter>(filter?: T) {
    if (filter) {
      const index = this.pp.filters.indexOf(filter);
      if (index !== -1) {
        this.pp.filters.splice(index, 1);
        this.onDirty(DirtyType.filter);
      }
    }
    return filter;
  }

  /**
   * 销毁所有滤镜
   */
  destroyFilters(): void {
    const { filters } = this;
    if (filters.length) {
      for (let i = filters.length - 1; i > -1; i--) {
        filters[i].destroy();
      }
      filters.length = 0;
      this.onDirty(DirtyType.filter);
    }
  }

  /**
   * 添加脚本
   * @param script 脚本实例
   * @returns 返回被提交的脚本实例
   */
  addScript<T extends ScriptBase>(script: T): T {
    const pp = this.pp;
    if (pp.scripts === defaultScripts) pp.scripts = [];
    pp.scripts.push(script);
    script.target = this;
    return script;
  }

  /**
   * 根据筛选器获取脚本实例，获取后尽量缓存，不要频繁获取
   * @returns 返回匹配的脚本实例
   */
  getScript<T extends ScriptBase>(options: { id?: string; label?: string; Class?: typeof ScriptBase }): T | undefined {
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
   * 销毁所有脚本
   */
  destroyScripts(): void {
    const { scripts } = this.pp;
    for (let i = scripts.length - 1; i > -1; i--) {
      scripts[i].destroy();
    }
    scripts.length = 0;
  }

  /**
   * 获取世界缩放值
   * @param root 相对 root，root 为空，则默认为 stage
   * @param out out 参数(可选)
   */
  getWorldScale(root?: Node, out?: IPoint): IPoint {
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
   * 获取世界旋转值，相对 root，root 为空，则默认为 stage
   * @returns 返回世界旋转值
   */
  getWorldRotation(root?: Node): number {
    let rotation = this.rotation;
    let parent = this.parent;
    while (parent) {
      rotation += parent.rotation;

      if (parent === root) break;
      parent = parent.parent;
    }
    return rotation;
  }

  /** 自定义 LocalBounds 边界 */
  protected _customLocalBounds(_bounds: Bounds) {}

  /**
   * 获取本地边界（相对于 parent）
   * 注意，这里的返回值是以节点级别进行复用，及时读取不受影响，如果想延迟使用，需要 clone
   * @returns 返回本地边界值
   */
  getLocalBounds(): Bounds {
    const pp = this.pp;
    const hasBounds = NodeCache.locBounds.has(this);
    const bounds = NodeCache.locBounds.get(this);
    // 子节点和显示没有变化时，直接返回之前的结果
    if (hasBounds && (pp.dirty & DirtyType.size) === 0 && (pp.dirty & DirtyType.child) === 0) return bounds;

    bounds.reset();
    // 如果有宽高，直接返回
    if (pp.width >= 0 && pp.height >= 0) {
      bounds.addFrame(0, 0, pp.width, pp.height);
      return bounds;
    }

    // 计算自己和子节点的 bounds
    this._customLocalBounds(bounds);
    for (const child of this.children) {
      const { pos } = child;
      if (child.rotation) {
        bounds.addFrame(0, 0, child.width, child.height);
        bounds.addFrame(0, child.height, child.width, 0);
        bounds.applyMatrix(child.localMatrix);
      } else {
        bounds.addFrame(pos.x, pos.y, pos.x + child.width, pos.y + child.height);
      }
    }
    if (bounds.width < 0 || bounds.height < 0) {
      console.warn("bounds width <=0", this);
    }
    return bounds;
  }

  /**
   * 获取世界边界，相对于root，如果 root 为空，则为 stage
   * 注意，这里的返回值是以节点级别进行复用，及时读取不受影响，如果想延迟使用，需要 clone
   * @returns 返回相对于世界或者 root 的边界值
   */
  getWorldBounds(root?: Node): Bounds {
    const hasBounds = NodeCache.gloBounds.has(this);
    const bounds = NodeCache.gloBounds.get(this);
    // 节点没有变化时，直接返回之前的结果
    if (hasBounds && !this.pp.dirty) return bounds;

    // 获取世界 bounds
    bounds.reset();
    const locBounds = this.getLocalBounds();
    bounds.addFrame(locBounds.x, locBounds.y, locBounds.right, locBounds.bottom, this.worldMatrix);

    // 转换为相对于 root 坐标系
    if (root && root !== this.stage) {
      const p1 = root.toLocalPoint(bounds);
      const scale = root.getWorldScale();
      bounds.set(p1.x, p1.y, p1.x + bounds.width / scale.x, p1.y + bounds.height / scale.y);
    }

    return bounds;
  }

  /**
   * 返回世界旋转边界值，相比 getWorldBounds 考虑了旋转角度
   * 注意，这里的返回值是以节点级别进行复用，及时读取不受影响，如果想延迟使用，需要 clone
   * @returns 返回相对于世界或者 root 的旋转边界值
   */
  getWorldRotatingRect(root?: Node): RotatingRect {
    const rRect = NodeCache.rotatingRect.get(this);
    this.toWorldPoint(Point.TEMP.set(0, 0), rRect);
    const scale = this.getWorldScale(root, Point.TEMP);
    rRect.width = this.width * scale.x;
    rRect.height = this.height * scale.y;
    rRect.rotation = this.getWorldRotation(root);
    return rRect;
  }

  /**
   * 把指定坐标位置，转换为世界坐标位置
   * @param pos 相对于本节点的坐标位置
   * @param out 输出Point，不传入默认创建一个新的 point
   * @param root 根节点，默认为 stage
   * @returns 返回此点的世界坐标
   */
  toWorldPoint<P extends IPoint = Point>(pos: IPoint, out?: P, root?: Node): P {
    let p = this.worldMatrix.apply<P>(pos, out);
    if (root && root !== this.stage) p = root.toLocalPoint(p, out);
    return p;
  }

  /**
   * 把世界坐标，转换为本地坐标
   * @param pos 世界坐标位置
   * @param out 输出Point，不传入默认创建一个新的 point
   * @param root 根节点，默认为 stage
   * @returns 返回此点的本地坐标
   */
  toLocalPoint<P extends IPoint = Point>(pos: IPoint, out?: P, root?: Node): P {
    const p = root ? root.toWorldPoint(pos, out) : pos;
    return this.worldMatrix.applyInverse<P>(p, out);
  }

  /**
   * 从 json 数据创建节点
   * @param json 节点的 json 数据
   */
  fromJson(json: INodeData) {
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
  }

  /**
   * 根据 json 数据修改属性
   * @param props json 数据
   */
  setProps(props?: Record<string, unknown>): this {
    if (props) {
      const keys = Object.keys(props);
      for (const key of keys) {
        if (key in this) (this as any)[key] = props[key];
      }
    }
    return this;
  }

  /**
   * 通过脚本数据列表，重置脚本
   * @param scripts 脚本数据列表
   */
  setScripts(scripts?: IScriptData[]) {
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
  }

  /**
   * 通过滤镜数据列表，重置脚本
   * @param scripts 滤镜数据列表
   */
  setFilters(filters?: IFilterData[]) {
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
  }

  /**
   * 某个点是否在节点内部
   * @param point 节点位置(世界坐标)
   * @returns 是否在节点内部
   */
  hitTest(point: IPoint) {
    const locPos = this.toLocalPoint(point, Point.TEMP);
    const bounds = this.getLocalBounds();
    return bounds.contains(locPos.x, locPos.y);
  }

  /**
   * 注册事件监听（多次注册，只生效最后一次）
   * @param type 事件类型，不区分大小写
   * @param listener 回调函数
   * @param caller 回调函数所在的域，一般为this
   */
  on(type: string, listener: (...args: any[]) => void, caller?: any): void {
    if (this.pp.event === defaultEvent) this.pp.event = new Dispatcher();
    if (mouseMap[type]) {
      this.mouseEnable = true;
      this.mouseEnableChildren = true;
      this._$mouseEnableParent();
    }
    this.pp.event.on(type, listener, caller);
  }

  private _$mouseEnableParent() {
    let parent = this.parent;
    while (parent && !parent.mouseEnableChildren) {
      parent.mouseEnableChildren = true;
      parent = parent.parent;
    }
  }

  /**
   * 注册一次性事件监听，事件被执行后，则自动取消监听（多次注册，只生效最后一次）
   * @param type 事件类型，不区分大小写
   * @param listener 回调函数
   * @param caller 回调函数所在的域，一般为this
   */
  once(type: string, listener: (...args: any[]) => void, caller?: any): void {
    if (this.pp.event === defaultEvent) this.pp.event = new Dispatcher();
    if (mouseMap[type]) {
      this.mouseEnable = true;
      this.mouseEnableChildren = true;
      this._$mouseEnableParent();
    }
    this.pp.event.once(type, listener, caller);
  }

  /**
   * 取消事件监听
   * @param type 事件类型，不区分大小写
   * @param listener 回调函数
   * @param caller 回调函数所在的域，一般为this
   */
  off(type: string, listener: (...args: any[]) => void, caller?: any): void {
    if (this.pp.event === defaultEvent) return;
    this.pp.event.off(type, listener, caller);
  }

  /**
   * 取消特定域的所有事件监听，如果参数为空，则清空所有事件监听
   * @param caller 函数域，可选，如果为空，则清空所有事件监听
   */
  offAll(caller?: unknown): void {
    if (this.pp.event === defaultEvent) return;
    this.pp.event.offAll(caller);
  }

  /**
   * 派发事件
   * @param type 事件名称，不区分大小写
   * @param args 可选参数，支持多个，以逗号隔开
   */
  emit(type: string, ...args: any[]): void {
    if (this.pp.event === defaultEvent) return;
    this.pp.event.emit(type, ...args);
  }

  /**
   * 是否有监听
   * @param type 事件名称，不区分大小写
   */
  hasListener(type: string): boolean {
    if (this.pp.event === defaultEvent) return false;
    return this.pp.event.hasListener(type);
  }
}
