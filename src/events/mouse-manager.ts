import { App } from "../app";
import type { IPoint } from "../math/point";
import type { Node } from "../nodes/node";
import type { Stage } from "../nodes/stage";
import { MouseEvent } from "./mouse-event";

const eventMap = {
  down: new MouseEvent("mousedown"),
  up: new MouseEvent("mouseup"),
  move: new MouseEvent("mousemove"),
  over: new MouseEvent("mouseover"),
  out: new MouseEvent("mouseout"),
  upOutside: new MouseEvent("mouseupoutside"),
  click: new MouseEvent("click"),
};

type EventType = keyof typeof eventMap;

/**
 * 鼠标事件管理器
 */
export class MouseManager {
  private _downHandler = this._onPointerDown.bind(this);
  private _moveHandler = this._onPointerMove.bind(this);
  private _upHandler = this._onPointerUp.bind(this);
  /** 最后 over 的节点 */
  private _lastOver: Node | undefined;

  private _canvas: HTMLCanvasElement;

  constructor(public root: Stage) {
    this._canvas = root.canvas;
    this._canvas.addEventListener("pointerdown", this._downHandler, { capture: true, passive: true });
    // 监听globalThis是为了实现画布外拖动和鼠标抬起
    globalThis.addEventListener("pointermove", this._moveHandler, { capture: true, passive: true });
    globalThis.addEventListener("pointerup", this._upHandler, { capture: true, passive: true });
  }

  destroy() {
    this._canvas.removeEventListener("pointerdown", this._downHandler, true);
    globalThis.removeEventListener("pointermove", this._moveHandler, true);
    globalThis.removeEventListener("pointerup", this._upHandler, true);
  }

  private _onPointerDown(e: PointerEvent): void {
    const downEvent = this._convertEvent(e, "down");
    this.hitTest(this.root, downEvent.mouse, downEvent.path);
    this._emitEvent(downEvent);
  }

  private _onPointerUp(e: PointerEvent): void {
    const upEvent = this._convertEvent(e, "up");
    const downPath = eventMap.down.path;

    // 判断是否在 canvas 外部
    if (e.target === this._canvas) {
      this.hitTest(this.root, upEvent.mouse, upEvent.path);
      this._emitEvent(upEvent);

      // 如果没有被preventDefault，则触发 click 事件
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
      // 画布外，派发 upOutSide 事件
      const outsizeUpEvent = this._cloneEvent(upEvent, "upOutside");
      outsizeUpEvent.path.push(...downPath);
      this._emitEvent(outsizeUpEvent);
    }
  }

  private _onPointerMove(e: PointerEvent): void {
    // 处理鼠标移动事件
    const moveEvent = this._convertEvent(e, "move");
    this.hitTest(this.root, moveEvent.mouse, moveEvent.path);
    if (moveEvent.path.length < 1) return;
    this._emitEvent(moveEvent);

    // over out
    const mouseTarget = moveEvent.path[0];
    const overEvent = this._cloneEvent(moveEvent, "over");
    const outEvent = this._cloneEvent(moveEvent, "out");
    if (this._lastOver !== mouseTarget) {
      if (this._lastOver) {
        this._getPathByTarget(this._lastOver, outEvent.path);
        this._emitEvent(outEvent);
      }
      if (mouseTarget !== this.root) {
        this._getPathByTarget(mouseTarget, overEvent.path);
        this._emitEvent(overEvent);
        this._lastOver = mouseTarget;
      } else {
        this._lastOver = undefined;
      }
    }
  }

  private _getPathByTarget(target: Node, path: Node[]) {
    if (target.mouseEnable) path.push(target);
    if (target.parent) {
      this._getPathByTarget(target.parent, path);
    }
  }

  private _cloneEvent(event: MouseEvent, type: EventType) {
    const newEvent = eventMap[type];
    const newType = newEvent.type;
    newEvent.cloneFrom(event);
    newEvent.type = newType;
    newEvent.propagationStopped = false;
    newEvent.preventDefaulted = false;
    newEvent.path.length = 0;
    return newEvent;
  }

  /** 转换原始鼠标事件为引擎的鼠标事件 */
  private _convertEvent(e: PointerEvent, type: EventType): MouseEvent {
    const event = eventMap[type];
    event.nativeEvent = e;
    event.mouse = this._convertPoint(e.clientX, e.clientY, event.mouse);
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

  /** 转换鼠标事件的坐标为 stage 坐标 */
  private _convertPoint(x: number, y: number, out: IPoint) {
    // canvas 是否在 document 中
    const canvas = this._canvas;
    const rect = canvas.isConnected
      ? canvas.getBoundingClientRect()
      : { width: canvas.width, height: canvas.height, left: 0, top: 0 };

    out.x = ((x - rect.left) * (canvas.width / rect.width)) / App.pixelRatio;
    out.y = ((y - rect.top) * (canvas.height / rect.height)) / App.pixelRatio;
    return out;
  }

  /**
   * 对目标节点进行鼠标碰撞测试
   * @param target 碰撞的目标节点
   * @param mouse 鼠标位置
   * @param out 输出数组
   * @returns 返回命中的节点列表
   */
  hitTest(target: Node, mouse: IPoint, out: Node[]): Node[] {
    // 节点可见，并且节点接受鼠标事件，才进行碰撞判断
    if ((!target.mouseEnable && !target.mouseEnableChildren) || !target.visible) return out;

    // 从上往下，命中子节点，命中后冒泡到父节点
    if (target.mouseEnableChildren && target.children.length) {
      for (let i = target.children.length - 1; i > -1; i--) {
        const child = target.children[i];
        const list = this.hitTest(child, mouse, out);
        if (list.length) {
          // 把父节点加到冒泡列表
          if (target.mouseEnable) list.push(target);
          return list;
        }
      }
    }

    // 判断当前节点是否命中
    if (target.mouseEnable && target.hitTest(mouse)) {
      out.push(target);
    }
    return out;
  }

  /** 冒泡派发鼠标事件 */
  private _emitEvent(event: MouseEvent) {
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
