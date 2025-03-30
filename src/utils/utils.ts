import type { IScriptData } from "../nodes/node";
import type { ScriptBase } from "../scripts/script-base";
import { getRegScript } from "./register";
import { Timer } from "./timer";

/** 临时画布 */
export const tempCanvas = createCanvas(100, 100);
/** 临时画布上下文 */
export const tempCtx = tempCanvas.getContext("2d") as CanvasRenderingContext2D;

let id = 0;
/** 获得全局唯一 ID */
export function getUID(type = "") {
  id++;
  return type + Date.now() + id;
}

/** 创建画布 */
export function createCanvas(width = 100, height = 100) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** 获取根路径，返回 xx/ */
export function getPathRoot(url: string) {
  const arr = url.split("/");
  arr.pop();
  return `${arr.join("/")}/`;
}

/** 等待多少秒 */
export function wait(time: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, time * 1000);
  });
}

/** 等待下一帧 */
export function waitNextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    Timer.system.frameOnce(1, () => resolve());
  });
}

/** clone json */
export function cloneJson(json: Record<string, unknown>): Record<string, unknown> {
  const str = JSON.stringify(json);
  return JSON.parse(str);
}

/** 根据脚本数据创建脚本 */
export function createScript(json: IScriptData): ScriptBase | undefined {
  const script = getRegScript(json.props.script);
  if (script) {
    script.id = json.id;
    script.setProps(json.props);
  }
  return script;
}
