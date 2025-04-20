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

/** 节点数据接口 */
export interface INodeData {
  /** 节点 id，是节点的唯一标识，一般由编辑器指定 */
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
    pointerEnabled?: boolean;
    pointerEnabledForChildren?: boolean;
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
  /** 脚本唯一标识 */
  id: string;
  /** 脚本类型 */
  type: "Script" | "Effect" | "Controller";
  /** 脚本描述，方便 AI 读取 */
  description?: string;
  /** 脚本属性 */
  props: {
    script: string;
    label?: string;
    enabled?: boolean;
    [key: string]: any;
  };
}

/** 滤镜数据接口 */
export interface IFilterData {
  /** 滤镜唯一标识 */
  id: string;
  /** 滤镜类型 */
  type: string;
  /** 滤镜描述，方便 AI 读取 */
  description?: string;
  /** 滤镜属性 */
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
  parent?: LikoNode;
  localBounds: Bounds;
}

/** 节点初始化选项接口 */
export interface INodeOptions {
  /** 节点唯一标识 */
  id?: string;
  /** 节点标签 */
  label?: string;
  /** 节点位置 */
  pos?: IPoint;
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
  /** 用户自定义数据 */
  userData?: Record<string, any>;
  /** 父节点 */
  parent?: LikoNode;
  /** 脚本列表 */
  scripts?: ScriptBase[];

  /** 点击事件回调 */
  onClick?: (e: LikoPointerEvent) => void;
  /** 指针按下事件回调 */
  onPointerDown?: (e: LikoPointerEvent) => void;
  /** 指针抬起事件回调 */
  onPointerUp?: (e: LikoPointerEvent) => void;
  /** 指针移动事件回调 */
  onPointerMove?: (e: LikoPointerEvent) => void;
  /** 指针进入事件回调 */
  onPointerOver?: (e: LikoPointerEvent) => void;
  /** 指针离开事件回调 */
  onPointerOut?: (e: LikoPointerEvent) => void;
  /** 指针在外部抬起事件回调 */
  onPointerUpOutside?: (e: LikoPointerEvent) => void;
}

/**
 * 节点基类
 */
export abstract class LikoNode {
  /** @private 私有变量，可以读取，但尽量不要直接修改 */
  pp: INodePrivateProps = {
    id: "",
    userData: defaultData,
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
    localBounds: new Bounds(),
  };

  /** 是否启用节点，如果设置为 false，则节点不可用，并且脚本也不执行，相比 visible 只影响其显示 */
  enabled = true;
  /** 节点标签名称 */
  label = "";
  /** 是否缓存为静态渲染，对具有大量不变子节点的容器，缓存能提升渲染效率 */
  cacheEnabled = false;
  /**
   * 是否支持鼠标事件，默认不支持，增加鼠标事件监听后，会自动打开为支持。
   * 如果父节点 pointerEnabled=true，则会优先判断父节点命中后，才再次判定子节点，以节省性能
   */
  pointerEnabled = false;
  /**
   * 是否支持子节点鼠标事件判定，增加鼠标事件监听后，会自动打开为支持。
   * 如果节点 pointerEnabled=false，但 pointerEnabledForChildren=true，则依然尝试命中子节点，然后冒泡
   */
  pointerEnabledForChildren = false;

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
    return this.pp.parent?.scene;
  }

  /** 父节点引用，只有被添加到父节点内，此属性才有值 */
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

  /** 子节点列表，请勿直接修改此数组，但可以直接读取 */
  get children(): LikoNode[] {
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
  set scripts(value: ScriptBase[]) {
    for (const script of value) {
      this.addScript(script);
    }
  }

  /** 自定义数据，比如 `node.userData.speed = 1` */
  get userData(): Record<string, any> {
    if (this.pp.userData === defaultData) this.pp.userData = {};
    return this.pp.userData;
  }
  set userData(value: Record<string, any>) {
    this.pp.userData = value;
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
      this.markDirty(DirtyType.child);
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
      this.transform.pivot.x = value * pp.anchor.x;
      this.emit(EventType.resize);
      this.markDirty(DirtyType.size);
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
      this.transform.pivot.y = value * pp.anchor.y;
      this.emit(EventType.resize);
      this.markDirty(DirtyType.size);
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
    return this.transform.scale;
  }
  set scale(value: IPoint) {
    this.transform.scale.copyFrom(value);
  }

  /** 节点旋转弧度 */
  get rotation(): number {
    return this.transform.rotation;
  }
  set rotation(value: number) {
    this.transform.rotation = value;
  }

  /** 节点旋转角度，底层数据还是 rotation */
  get angle(): number {
    return this.transform.rotation * RAD_TO_DEG;
  }
  set angle(value: number) {
    this.transform.rotation = value * DEG_TO_RAD;
  }

  /** 节点轴心点，此值影响节点旋转和缩放的中心（只读） */
  get pivot(): IPoint {
    return this.transform.pivot;
  }

  /** 节点轴心点，此值为相比宽高的百分比，比如 0.5，为图片的中心 */
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

  /** 节点叠加颜色 */
  get tintColor(): ColorData {
    return this.pp.color.value;
  }
  set tintColor(value: ColorData) {
    const pp = this.pp;
    if (pp.color.value !== value) {
      if (pp.color === Color.Default) pp.color = new Color(value);
      pp.color.value = value;
      this.markDirty(DirtyType.color);
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
      this.markDirty(DirtyType.color);
    }
  }

  /** 获取节点变换对象 */
  get transform() {
    if (this.pp.transform === defaultTF) {
      this.pp.transform = new Transform({ observer: this });
    }
    return this.pp.transform;
  }

  /** 本地矩阵（相对于 parent） */
  get localMatrix() {
    const { dirty, transform, localMatrix, pos } = this.pp;
    // 矩阵发生变化时，才重新计算矩阵
    if (dirty & DirtyType.transform) {
      return transform.getMatrix(localMatrix, pos);
    }
    return localMatrix;
  }
  set localMatrix(value) {
    const { pos, scale, rotation } = value.decompose(this.pp.transform);
    this.pos = pos;
    this.scale = scale;
    this.rotation = rotation;
  }

  /** 世界矩阵（相对于 stage） */
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
   * 当节点发生变化后，调用此函数标记为脏状态
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
   * 添加子节点
   * @param child - 子节点
   * @param index - 指定索引位置（可选）
   * @returns 返回被添加的子节点
   */
  addChild<T extends LikoNode>(child: T, index?: number): T {
    const pp = this.pp;
    if (pp.children === defaultChildren) pp.children = [];
    child.removeSelf();
    child.pp.parent = this;
    if (index !== undefined) pp.children.splice(index, 0, child);
    else pp.children.push(child);
    if (pp.stage) this._$addToStage(child, pp.stage);
    child.emit(EventType.added, this);
    this.markDirty(DirtyType.child);
    return child;
  }

  private _$addToStage(child: LikoNode, stage: Stage) {
    child.pp.stage = stage;
    child.emit(EventType.addToStage, stage);
    for (const node of child.children) {
      this._$addToStage(node, stage);
    }
  }

  /**
   * 找到自己在父节点的索引顺序
   * @returns 返回自己在父节点的索引顺序，如果没有父节点则返回 -1
   */
  getIndexInParent(): number {
    if (this.parent) return this.parent.children.indexOf(this);
    return -1;
  }

  /**
   * 修改子节点索引
   * @param child - 子节点
   * @param index - 新的索引位置
   * @throws 如果索引超出范围则抛出错误
   */
  setChildIndex(child: LikoNode, index: number): void {
    const children = this.children;
    if (index < 0 || index >= children.length) {
      throw new Error(`The index ${index} is out of bounds`);
    }
    const currentIndex = child.getIndexInParent();
    children.splice(currentIndex, 1);
    children.splice(index, 0, child);
    this.markDirty(DirtyType.child);
  }

  /**
   * 根据筛选器获得子节点实例
   * @param options - 筛选选项
   * @returns 返回查找到的子节点，如果未找到则返回 undefined
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
   * 删除子节点
   * @param child - 子节点
   * @returns 返回被删除的子节点，如果未找到则返回传入的参数
   */
  removeChild<T extends LikoNode>(child?: T) {
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
      this.markDirty(DirtyType.child);
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
      this.markDirty(DirtyType.child);
    }
  }

  /**
   * 添加滤镜
   * @param filter - 滤镜
   * @returns 返回被添加的滤镜
   */
  addFilter<T extends Filter>(filter: T): T {
    if (this.pp.filters === defaultFilters) this.pp.filters = [];
    this.pp.filters.push(filter);
    this.markDirty(DirtyType.filter);
    return filter;
  }

  /**
   * 更新滤镜，当更新滤镜参数时调用
   * @param filter - 滤镜
   * @returns 返回更新的滤镜
   */
  updateFilter<T extends Filter>(filter: T): T {
    filter._dirty = true;
    this.markDirty(DirtyType.filter);
    return filter;
  }

  /**
   * 根据筛选器获取滤镜实例
   * @param options - 筛选选项
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
   * 删除滤镜
   * @param filter - 滤镜
   * @returns 返回被删除的滤镜，如果未找到则返回传入的参数
   */
  removeFilter<T extends Filter>(filter?: T) {
    if (filter) {
      const index = this.pp.filters.indexOf(filter);
      if (index !== -1) {
        this.pp.filters.splice(index, 1);
        this.markDirty(DirtyType.filter);
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
      this.markDirty(DirtyType.filter);
    }
  }

  /**
   * 添加脚本
   * @param script - 脚本实例
   * @returns 返回被添加的脚本实例
   */
  addScript<T extends ScriptBase>(script: T): T {
    const pp = this.pp;
    if (pp.scripts === defaultScripts) pp.scripts = [];
    pp.scripts.push(script);
    script.target = this;
    return script;
  }

  /**
   * 根据筛选器获取脚本实例
   * @param options - 筛选选项
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
   * @param root - 相对 root，root 为空，则默认为 stage
   * @param out - out 参数(可选)
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
   * 获取世界旋转值
   * @param root - 相对 root，root 为空，则默认为 stage
   * @returns 返回世界旋转值
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

  /** 自定义 LocalBounds 边界 */
  protected _customLocalBounds(_bounds: Bounds) {}

  /**
   * 获取本地边界（相对于 parent）
   * 注意，这里的返回值是以节点级别进行复用，及时读取不受影响，如果想延迟使用，需要 clone
   * @returns 返回本地边界值
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
   * 获取世界边界，相对于 root，如果 root 为空，则为 stage
   * 注意，这里的返回值是以节点级别进行复用，及时读取不受影响，如果想延迟使用，需要 clone
   * @param root - 相对于哪个节点计算边界
   * @returns 返回相对于世界或者 root 的边界值
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
      const p1 = root.toLocalPoint(bounds);
      const scale = root.getWorldScale();
      bounds.set(p1.x, p1.y, p1.x + bounds.width / scale.x, p1.y + bounds.height / scale.y);
    }

    return bounds;
  }

  /**
   * 返回世界旋转边界值，相比 getWorldBounds 考虑了旋转角度
   * 注意，这里的返回值是以节点级别进行复用，及时读取不受影响，如果想延迟使用，需要 clone
   * @param root - 相对于哪个节点计算边界
   * @returns 返回相对于世界或者 root 的旋转边界值
   */
  getWorldRotatingRect(root?: LikoNode): RotatingRect {
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
   * @param pos - 相对于本节点的坐标位置
   * @param out - 输出 Point，不传入默认创建一个新的 point
   * @param root - 根节点，默认为 stage
   * @returns 返回此点的世界坐标
   */
  toWorldPoint<P extends IPoint = Point>(pos: IPoint, out?: P, root?: LikoNode): P {
    const result = this.worldMatrix.apply<P>(pos, out);
    if (root && root !== this.stage) root.toLocalPoint(result, result);
    return result;
  }

  /**
   * 把世界坐标，转换为本地坐标
   * @param pos - 世界坐标位置
   * @param out - 输出 Point，不传入默认创建一个新的 point
   * @param root - 根节点，默认为 stage
   * @returns 返回此点的本地坐标
   */
  toLocalPoint<P extends IPoint = Point>(pos: IPoint, out?: P, root?: LikoNode): P {
    if (root && root !== this.stage) {
      const result = root.worldMatrix.apply<P>(pos, out);
      return this.worldMatrix.applyInverse<P>(result, result);
    }
    return this.worldMatrix.applyInverse<P>(pos);
  }

  /**
   * 从 json 数据创建节点
   * @param json - 节点的 json 数据
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
   * @param props - json 数据
   * @returns 返回当前节点实例
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
   * 通过脚本数据列表，重置脚本
   * @param scripts - 脚本数据列表
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
   * 通过滤镜数据列表，重置滤镜
   * @param filters - 滤镜数据列表
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
   * @param point - 节点位置(世界坐标)
   * @returns 是否在节点内部
   */
  hitTest(point: IPoint) {
    const locPos = this.toLocalPoint(point, Point.TEMP);

    const { width, height } = this.pp;
    if (width >= 0 && height >= 0) {
      return locPos.x >= 0 && locPos.y >= 0 && width >= locPos.x && height >= locPos.y;
    }

    const bounds = this.getLocalBounds();
    return bounds.contains(locPos.x, locPos.y);
  }

  /**
   * 注册事件监听（多次注册，只生效最后一次）
   * @param type - 事件类型，不区分大小写
   * @param listener - 回调函数
   * @param caller - 回调函数所在的域，一般为 this
   */
  on(type: string, listener: (...args: any[]) => void, caller?: any): void {
    if (this.pp.event === defaultEvent) this.pp.event = new Dispatcher();
    if (pointerMap[type]) {
      this.pointerEnabled = true;
      this.pointerEnabledForChildren = true;
      this._$pointerEnableParent();
    }
    this.pp.event.on(type, listener, caller);
  }

  private _$pointerEnableParent() {
    let parent = this.parent;
    while (parent && !parent.pointerEnabledForChildren) {
      parent.pointerEnabledForChildren = true;
      parent = parent.parent;
    }
  }

  /**
   * 注册一次性事件监听，事件被执行后，则自动取消监听（多次注册，只生效最后一次）
   * @param type - 事件类型，不区分大小写
   * @param listener - 回调函数
   * @param caller - 回调函数所在的域，一般为 this
   */
  once(type: string, listener: (...args: any[]) => void, caller?: any): void {
    if (this.pp.event === defaultEvent) this.pp.event = new Dispatcher();
    if (pointerMap[type]) {
      this.pointerEnabled = true;
      this.pointerEnabledForChildren = true;
      this._$pointerEnableParent();
    }
    this.pp.event.once(type, listener, caller);
  }

  /**
   * 取消事件监听
   * @param type - 事件类型，不区分大小写
   * @param listener - 回调函数
   * @param caller - 回调函数所在的域，一般为 this
   */
  off(type: string, listener: (...args: any[]) => void, caller?: any): void {
    if (this.pp.event === defaultEvent) return;
    this.pp.event.off(type, listener, caller);
  }

  /**
   * 取消特定域的所有事件监听，如果参数为空，则清空所有事件监听
   * @param caller - 函数域，可选，如果为空，则清空所有事件监听
   */
  offAll(caller?: unknown): void {
    if (this.pp.event === defaultEvent) return;
    this.pp.event.offAll(caller);
  }

  /**
   * 派发事件
   * @param type - 事件名称，不区分大小写
   * @param args - 可选参数，支持多个，以逗号隔开
   */
  emit(type: string, ...args: any[]): void {
    if (this.pp.event === defaultEvent) return;
    this.pp.event.emit(type, ...args);
  }

  /**
   * 是否有监听
   * @param type - 事件名称，不区分大小写
   * @returns 是否有对应事件的监听
   */
  hasListener(type: string): boolean {
    if (this.pp.event === defaultEvent) return false;
    return this.pp.event.hasListener(type);
  }
}
