import { App } from "../app";
import type { IPoint } from "../math/point";
import type { LikoNode } from "../nodes/node";
import type { Stage } from "../nodes/stage";
import { LikoPointerEvent } from "./pointer-event";

const eventMap = {
  down: new LikoPointerEvent("pointerdown"),
  up: new LikoPointerEvent("pointerup"),
  move: new LikoPointerEvent("pointermove"),
  over: new LikoPointerEvent("pointerover"),
  out: new LikoPointerEvent("pointerout"),
  upOutside: new LikoPointerEvent("pointerupoutside"),
  click: new LikoPointerEvent("click"),
};

type EventType = keyof typeof eventMap;

/**
 * 指针事件管理器，负责处理鼠标和触摸事件
 */
export class PointerManager {
  private _downHandler = this._onPointerDown.bind(this);
  private _moveHandler = this._onPointerMove.bind(this);
  private _upHandler = this._onPointerUp.bind(this);
  /** 最后触发 pointerover 事件的节点 */
  private _lastOver: LikoNode | undefined;

  private _canvas: HTMLCanvasElement;

  constructor(public root: Stage) {
    this._canvas = root.canvas;
    this._canvas.addEventListener("pointerdown", this._downHandler, { capture: true, passive: true });
    // 监听 globalThis 是为了实现画布外拖动和鼠标抬起
    globalThis.addEventListener("pointermove", this._moveHandler, { capture: true, passive: true });
    globalThis.addEventListener("pointerup", this._upHandler, { capture: true, passive: true });
  }

  /**
   * 销毁事件管理器，移除所有事件监听
   */
  destroy() {
    this._canvas.removeEventListener("pointerdown", this._downHandler, true);
    globalThis.removeEventListener("pointermove", this._moveHandler, true);
    globalThis.removeEventListener("pointerup", this._upHandler, true);

    this._lastOver = undefined;
  }

  private _onPointerDown(e: PointerEvent): void {
    const downEvent = this._convertEvent(e, "down");
    this.hitTest(this.root, downEvent.pointer, downEvent.path);
    this._emitEvent(downEvent);
  }

  private _onPointerUp(e: PointerEvent): void {
    const upEvent = this._convertEvent(e, "up");
    const downPath = eventMap.down.path;

    // 判断是否在 canvas 外部
    if (e.target === this._canvas) {
      this.hitTest(this.root, upEvent.pointer, upEvent.path);
      this._emitEvent(upEvent);

      // 如果没有被 preventDefault，则触发 click 事件
      if (!upEvent.preventDefaulted) {
        const clickEvent = this._cloneEvent(upEvent, "click");
        const clickPath = clickEvent.path;
        // 判断 down 和 up 的交集，派发 click 事件
        for (const target of upEvent.path) {
          if (downPath.includes(target)) {
            clickPath.push(target);
          }
        }
        this._emitEvent(clickEvent);
      }
    } else {
      // 画布外，派发 upOutside 事件
      const outsizeUpEvent = this._cloneEvent(upEvent, "upOutside");
      outsizeUpEvent.path.push(...downPath);
      this._emitEvent(outsizeUpEvent);
    }
  }

  private _onPointerMove(e: PointerEvent): void {
    // TODO 需要处理防抖吗

    // 处理指针移动事件
    const moveEvent = this._convertEvent(e, "move");
    this.hitTest(this.root, moveEvent.pointer, moveEvent.path);
    if (moveEvent.path.length < 1) return;
    this._emitEvent(moveEvent);

    // 处理 pointerover 和 pointerout 事件
    const pointerTarget = moveEvent.path[0];
    const overEvent = this._cloneEvent(moveEvent, "over");
    const outEvent = this._cloneEvent(moveEvent, "out");
    if (this._lastOver !== pointerTarget) {
      if (this._lastOver) {
        this._getPathByTarget(this._lastOver, outEvent.path);
        this._emitEvent(outEvent);
      }
      if (pointerTarget !== this.root) {
        this._getPathByTarget(pointerTarget, overEvent.path);
        this._emitEvent(overEvent);
        this._lastOver = pointerTarget;
      } else {
        this._lastOver = undefined;
      }
    }
  }

  /**
   * 根据目标节点获取事件冒泡路径
   */
  private _getPathByTarget(target: LikoNode, path: LikoNode[]) {
    if (target.pointerEnabled) path.push(target);
    if (target.parent) {
      this._getPathByTarget(target.parent, path);
    }
  }

  /**
   * 克隆事件对象并设置新的事件类型
   */
  private _cloneEvent(event: LikoPointerEvent, type: EventType) {
    const newEvent = eventMap[type];
    const newType = newEvent.type;
    newEvent.cloneFrom(event);
    newEvent.type = newType;
    newEvent.propagationStopped = false;
    newEvent.preventDefaulted = false;
    newEvent.path.length = 0;
    return newEvent;
  }

  /**
   * 转换原生指针事件为引擎的指针事件
   */
  private _convertEvent(e: PointerEvent, type: EventType): LikoPointerEvent {
    const event = eventMap[type];
    event.nativeEvent = e;
    event.pointer = this._convertPoint(e.clientX, e.clientY, event.pointer);
    event.movement.x = e.movementX;
    event.movement.y = e.movementY;
    event.altKey = e.altKey;
    event.ctrlKey = e.ctrlKey;
    event.shiftKey = e.shiftKey;
    event.detail = e.detail;
    event.button = e.button;
    event.propagationStopped = false;
    event.preventDefaulted = false;
    event.path.length = 0;

    return event;
  }

  /**
   * 转换客户端坐标为舞台坐标
   */
  private _convertPoint(x: number, y: number, out: IPoint) {
    // 判断 canvas 是否在 document 中
    const canvas = this._canvas;
    const rect = canvas.isConnected
      ? canvas.getBoundingClientRect()
      : { width: canvas.width, height: canvas.height, left: 0, top: 0 };

    out.x = ((x - rect.left) * (canvas.width / rect.width)) / App.pixelRatio;
    out.y = ((y - rect.top) * (canvas.height / rect.height)) / App.pixelRatio;
    return out;
  }

  /**
   * 对目标节点进行指针碰撞测试
   * @param target 碰撞的目标节点
   * @param pointer 指针位置
   * @param out 输出数组，存储命中的节点
   * @returns 返回命中的节点列表
   */
  hitTest(target: LikoNode, pointer: IPoint, out: LikoNode[]): LikoNode[] {
    // 节点可见，并且节点接受指针事件，才进行碰撞判断
    if ((!target.pointerEnabled && !target.pointerEnabledForChildren) || !target.visible) return out;

    // 从上往下，命中子节点，命中后冒泡到父节点
    if (target.pointerEnabledForChildren && target.children.length) {
      for (let i = target.children.length - 1; i > -1; i--) {
        const child = target.children[i];
        const list = this.hitTest(child, pointer, out);
        if (list.length) {
          // 把父节点加到冒泡列表
          if (target.pointerEnabled) list.push(target);
          return list;
        }
      }
    }

    // 判断当前节点是否命中
    if (target.pointerEnabled && target.hitTest(pointer)) {
      out.push(target);
    }
    return out;
  }

  /**
   * 冒泡派发指针事件
   */
  private _emitEvent(event: LikoPointerEvent) {
    if (event.path.length) {
      event.target = event.path[0];
      for (const target of event.path) {
        if (!event.propagationStopped) {
          event.currentTarget = target;
          target.emit(event.type, event);
        }
      }
    }
  }
}
