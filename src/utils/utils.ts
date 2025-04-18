import type { IScriptData } from "../nodes/node";
import type { ScriptBase } from "../scripts/script-base";
import { createScriptInstance } from "./register";
import { Timer } from "./timer";

let id = 0;

export function getUniqueID(): number {
  return id++;
}

const canvas = document.createElement("canvas");
canvas.width = 1;
canvas.height = 1;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

/**
 * 创建CanvasPattern
 * @param img - 图像
 * @returns CanvasPattern
 */
export function createPattern(img: CanvasImageSource, repetition: "no-repeat" | "repeat" | "repeat-x" | "repeat-y") {
  return ctx.createPattern(img, repetition) as CanvasPattern;
}

/**
 * 根据URL创建CanvasPattern
 * @param url - 图像URL
 * @returns CanvasPattern
 */
export function createPatternByUrl(url: string, repetition: "no-repeat" | "repeat" | "repeat-x" | "repeat-y") {
  return new Promise<CanvasPattern>((resolve) => {
    const img = new Image();
    img.src = url;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      resolve(ctx.createPattern(img, repetition) as CanvasPattern);
    };
  });
}

/**
 * 创建CanvasGradient
 * @param pos - 渐变位置
 * @param colors - 渐变颜色 rate:0-1
 * @returns CanvasGradient
 */
export function createLinearGradient(
  pos: { startX: number; startY: number; endX: number; endY: number },
  colors: { rate: number; color: string }[],
) {
  const grd = ctx.createLinearGradient(pos.startX, pos.startY, pos.endX, pos.endY);
  for (const color of colors) {
    grd.addColorStop(color.rate, color.color);
  }
  return grd;
}

/**
 * 生成全局唯一标识符
 * @param type - 标识符前缀
 * @returns 格式为 `${type}${递增ID}${随机字符串}` 的唯一标识符
 */
export function getUID(type = ""): string {
  id++;
  return `${type}${id}${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 创建指定尺寸的画布元素
 * @param width - 画布宽度，默认为100像素
 * @param height - 画布高度，默认为100像素
 * @returns 新创建的画布元素
 */
export function createCanvas(width = 100, height = 100): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * 获取URL的根路径
 * @param url - 输入的URL字符串
 * @returns 以斜杠结尾的根路径
 */
export function getPathRoot(url: string): string {
  const arr = url.split("/");
  arr.pop();
  return `${arr.join("/")}/`;
}

/**
 * 等待指定的秒数
 * @param seconds - 等待的秒数
 * @returns 在指定秒数后解析的Promise
 */
export function wait(seconds: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

/**
 * 等待下一帧渲染完成
 * @returns 在下一帧渲染后解析的Promise
 */
export function waitNextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    Timer.callLater(() => resolve());
  });
}

/**
 * 深拷贝JSON对象
 * @param json - 要克隆的JSON对象
 * @returns 克隆后的新对象
 */
export function cloneJson<T>(json: T): T {
  const str = JSON.stringify(json);
  return JSON.parse(str);
}

/**
 * 根据脚本数据创建脚本实例
 * @param json - 脚本数据
 * @returns 创建的脚本实例，如果创建失败则返回undefined
 */
export function createScript(json: IScriptData): ScriptBase | undefined {
  const script = createScriptInstance(json.props.script);
  if (script) {
    script.id = json.id;
    script.setProps(json.props);
  }
  return script;
}
