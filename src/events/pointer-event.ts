import type { LikoNode } from "../nodes/node";

// biome-ignore format:
/** 鼠标事件类型 */
export type PointerEventType = "click" | "pointerdown" | "pointerup" | "pointermove" | "pointerover" | "pointerout" | "pointerupoutside";

/**
 * 鼠标事件，出于性能考虑，鼠标事件节点是复用的，每个类型（比如 pointerup，click 等）共用一个鼠标事件节点
 * 及时读取不受影响，如果需要延迟读取鼠标事件内容，请 clone 他 */
export class LikoPointerEvent {
  /** 是否调用过 stopPropagation */
  propagationStopped = false;
  /** 是否调用过 preventDefault */
  preventDefaulted = false;
  /** 原始的鼠标事件 */
  nativeEvent!: PointerEvent;
  /** 鼠标事件目标节点 */
  target!: LikoNode;
  /** 鼠标事件冒泡到的当前节点 */
  currentTarget!: LikoNode;
  /** 相对于 stage 的鼠标位置 */
  pointer = { x: 0, y: 0 };
  /** 两次间隔鼠标移动差值 */
  movement = { x: 0, y: 0 };
  /** 是否同时按了 alt 键盘 */
  altKey = false;
  /** 是否同时按了 ctrl 键盘 */
  ctrlKey = false;
  /** 是否同时按了 shift 键盘 */
  shiftKey = false;
  /** click 事件时，detail 记录的是点击次数 */
  detail = 0;
  /** 代表按下的鼠标按键，0-鼠标左键，1-鼠标中键，2-鼠标右键 */
  button = 0;
  /** 鼠标事件冒泡路径 */
  path: LikoNode[] = [];

  /**
   * @param type 鼠标事件类型
   */
  constructor(public type: PointerEventType) {}

  /**
   * 阻止鼠标默认行为，如果是 up 时调用，则会阻止 click 事件的派发
   */
  preventDefault() {
    this.preventDefaulted = true;
    // 可能受到passive的影响？
    this.nativeEvent.preventDefault();
  }

  /**
   * 停止事件冒泡
   */
  stopPropagation() {
    this.propagationStopped = true;
  }

  /**
   * clone 别的鼠标事件数据到本鼠标事件
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
   * clone 当前鼠标事件
   */
  clone() {
    return new LikoPointerEvent(this.type).cloneFrom(this);
  }
}
