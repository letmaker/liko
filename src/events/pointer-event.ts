import type { LikoNode } from '../nodes/node';

// biome-ignore format:
/** 指针事件类型，包含点击、按下、抬起、移动、进入、离开等事件 */
export type PointerEventType = "click" | "pointerdown" | "pointerup" | "pointermove" | "pointerover" | "pointerout" | "pointerupoutside";

/**
 * 指针事件类，用于处理鼠标和触摸事件
 *
 * @remarks
 * 出于性能考虑，事件对象是复用的，每个事件类型（如 pointerup、click 等）共用一个事件实例
 * 如果需要延迟读取事件内容，请使用 clone 方法复制一个新的事件对象
 *
 * @example
 * ```typescript
 * // 在节点上监听指针事件
 * node.on('click', (event: LikoPointerEvent) => {
 *   console.log('点击位置:', event.pointer.x, event.pointer.y);
 *   console.log('目标节点:', event.target);
 *
 *   // 阻止事件冒泡
 *   event.stopPropagation();
 *
 *   // 阻止默认行为
 *   event.preventDefault();
 * });
 *
 * // 复制事件对象用于延迟处理
 * let savedEvent: LikoPointerEvent;
 * node.on('pointerdown', (event: LikoPointerEvent) => {
 *   savedEvent = event.clone();
 *   setTimeout(() => {
 *     console.log('延迟处理事件:', savedEvent.type);
 *   }, 1000);
 * });
 * ```
 */
export class LikoPointerEvent {
  /**
   * 标识事件是否已停止传播
   * @remarks 当调用 stopPropagation() 方法后，此属性将被设置为 true
   */
  propagationStopped = false;

  /**
   * 标识事件的默认行为是否已被阻止
   * @remarks 当调用 preventDefault() 方法后，此属性将被设置为 true
   */
  preventDefaulted = false;

  /**
   * 原始的浏览器 PointerEvent 对象
   * @remarks 可以通过此属性访问原始的浏览器事件对象，获取更多详细信息
   */
  nativeEvent!: PointerEvent;

  /**
   * 触发事件的目标节点
   * @remarks 始终指向最初触发事件的节点，即使在事件冒泡过程中也不会改变
   */
  target!: LikoNode;

  /**
   * 当前正在处理事件的节点
   * @remarks 在事件冒泡过程中，此属性会随着事件传播而变化，指向当前正在处理事件的节点
   */
  currentTarget!: LikoNode;

  /**
   * 相对于 stage 的指针坐标
   * @remarks 坐标原点为 stage 的左上角，单位为像素
   */
  pointer = { x: 0, y: 0 };

  /**
   * 指针移动的相对位移
   * @remarks 仅在 pointermove 事件中有意义，表示自上次事件以来指针的移动距离
   */
  movement = { x: 0, y: 0 };

  /**
   * 指示 Alt 键是否被按下
   * @remarks 在事件触发时检测修饰键状态
   */
  altKey = false;

  /**
   * 指示 Ctrl 键是否被按下
   * @remarks 在事件触发时检测修饰键状态
   */
  ctrlKey = false;

  /**
   * 指示 Shift 键是否被按下
   * @remarks 在事件触发时检测修饰键状态
   */
  shiftKey = false;

  /**
   * 事件的详细信息
   * @remarks 对于 click 事件表示点击次数（单击为1，双击为2等）
   */
  detail = 0;

  /**
   * 触发事件的指针按键
   * @remarks 0 - 左键，1 - 中键，2 - 右键
   */
  button = 0;

  /**
   * 事件的冒泡路径
   * @remarks 包含从目标节点到根节点的完整路径，用于事件传播
   */
  path: LikoNode[] = [];

  /**
   * 创建一个新的指针事件对象
   * @param type 指针事件类型
   */
  constructor(public type: PointerEventType) {}

  /**
   * 阻止事件的默认行为
   * @remarks
   * - 如果在 pointerup 事件中调用，将会阻止后续 click 事件的派发
   * - 在 passive 事件监听器中调用可能无效
   */
  preventDefault() {
    this.preventDefaulted = true;
    this.nativeEvent.preventDefault();
  }

  /**
   * 停止事件在节点树中的进一步冒泡传播
   * @remarks 调用此方法后，事件将不会继续向父节点传播
   */
  stopPropagation() {
    this.propagationStopped = true;
  }

  /**
   * 从其他事件对象复制属性到当前事件
   * @param event 源事件对象
   * @returns 返回当前事件对象，支持链式调用
   * @remarks 用于事件对象的重用和属性复制
   */
  cloneFrom(event: LikoPointerEvent): this {
    this.type = event.type;
    this.nativeEvent = event.nativeEvent;
    this.target = event.target;
    this.currentTarget = event.currentTarget;
    this.pointer = event.pointer;
    this.movement = event.movement;
    this.altKey = event.altKey;
    this.ctrlKey = event.ctrlKey;
    this.shiftKey = event.shiftKey;
    this.detail = event.detail;
    this.button = event.button;
    return this;
  }

  /**
   * 创建当前事件对象的副本
   * @returns 新的事件对象副本
   * @remarks
   * - 由于事件对象是复用的，如果需要延迟处理事件数据，必须使用此方法创建副本
   * - 返回的副本包含当前事件的所有属性值
   */
  clone() {
    return new LikoPointerEvent(this.type).cloneFrom(this);
  }
}
