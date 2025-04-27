import type { LikoNode } from "../nodes/node";

// biome-ignore format:
/** 指针事件类型，包含点击、按下、抬起、移动、进入、离开等事件 */
export type PointerEventType = "click" | "pointerdown" | "pointerup" | "pointermove" | "pointerover" | "pointerout" | "pointerupoutside";

/**
 * 指针事件类，用于处理鼠标和触摸事件
 *
 * @remarks
 * 出于性能考虑，事件对象是复用的，每个事件类型（如 pointerup、click 等）共用一个事件实例
 * 如果需要延迟读取事件内容，请使用 clone 方法复制一个新的事件对象
 */
export class LikoPointerEvent {
  /** 标识事件是否已停止传播 */
  propagationStopped = false;
  /** 标识事件的默认行为是否已被阻止 */
  preventDefaulted = false;
  /** 原始的浏览器 PointerEvent 对象 */
  nativeEvent!: PointerEvent;
  /** 触发事件的目标节点 */
  target!: LikoNode;
  /** 当前正在处理事件的节点 */
  currentTarget!: LikoNode;
  /** 相对于 stage 的指针坐标 */
  pointer = { x: 0, y: 0 };
  /** 指针移动的相对位移 */
  movement = { x: 0, y: 0 };
  /** 指示 Alt 键是否被按下 */
  altKey = false;
  /** 指示 Ctrl 键是否被按下 */
  ctrlKey = false;
  /** 指示 Shift 键是否被按下 */
  shiftKey = false;
  /** 事件的详细信息，对于 click 事件表示点击次数 */
  detail = 0;
  /** 触发事件的指针按键：0 - 左键，1 - 中键，2 - 右键 */
  button = 0;
  /** 事件的冒泡路径，从目标节点到根节点 */
  path: LikoNode[] = [];

  /**
   * @param type 鼠标事件类型
   */
  constructor(public type: PointerEventType) {}

  /**
   * 阻止事件的默认行为
   *
   * @remarks
   * 如果在 pointerup 事件中调用，将会阻止后续 click 事件的派发
   * 注意：在 passive 事件监听器中调用可能无效
   */
  preventDefault() {
    this.preventDefaulted = true;
    this.nativeEvent.preventDefault();
  }

  /**
   * 停止事件在节点树中的进一步冒泡传播
   */
  stopPropagation() {
    this.propagationStopped = true;
  }

  /**
   * 从其他事件对象复制属性到当前事件
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
   */
  clone() {
    return new LikoPointerEvent(this.type).cloneFrom(this);
  }
}
