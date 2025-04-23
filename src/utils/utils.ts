import type { IScriptData } from "../nodes/node";
import type { ScriptBase } from "../scripts/script-base";
import { createScriptInstance } from "./register";
import { Timer } from "./timer";

let id = 0;

export function getUniqueID(): number {
  return id++;
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

const canvas = document.createElement("canvas");
canvas.width = 1;
canvas.height = 1;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

/**
 * 创建重复图案
 * @param img - 源图像
 * @param repetition - 重复方式
 * @returns 创建的图案对象
 */
export function createPattern(img: CanvasImageSource, repetition: "no-repeat" | "repeat" | "repeat-x" | "repeat-y") {
  return ctx.createPattern(img, repetition) as CanvasPattern;
}

/**
 * 从 URL 创建重复图案
 * @param url - 图像 URL
 * @param repetition - 重复方式
 * @returns Promise，解析为创建的图案对象
 */
export function createPatternFromUrl(url: string, repetition: "no-repeat" | "repeat" | "repeat-x" | "repeat-y") {
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
 * 创建线性渐变
 * @param pos - 渐变位置配置
 * @param colorStops - 颜色停止点数组
 * @returns 创建的渐变对象
 */
export function createLinearGradient(
  pos: { startX: number; startY: number; endX: number; endY: number },
  colorStops: { offset: number; color: string }[],
) {
  const grd = ctx.createLinearGradient(pos.startX, pos.startY, pos.endX, pos.endY);
  for (const color of colorStops) {
    grd.addColorStop(color.offset, color.color);
  }
  return grd;
}

/**
 * 创建径向渐变
 * @param pos - 渐变位置配置
 * @param colorStops - 颜色停止点数组
 * @returns 创建的渐变对象
 */
export function createRadialGradient(
  pos: { startX: number; startY: number; startRadius: number; endX: number; endY: number; endRadius: number },
  colorStops: { offset: number; color: string }[],
) {
  const grd = ctx.createRadialGradient(pos.startX, pos.startY, pos.startRadius, pos.endX, pos.endY, pos.endRadius);
  for (const color of colorStops) {
    grd.addColorStop(color.offset, color.color);
  }
  return grd;
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
