import type { INodeData, IScriptData } from '../nodes/node';
import type { BaseScript } from '../scripts/base-script';
import { createNodeInstance, createScriptInstance } from './register';
import { Timer } from './timer';

/** 用于生成唯一标识符的递增计数器 */
let id = 0;

/**
 * 生成一个递增的唯一数字标识符
 * @returns 唯一的数字标识符
 */
export function getUIDNumber(): number {
  return id++;
}

/**
 * 生成一个全局唯一的字符串标识符
 * @param type - 标识符前缀
 * @returns 格式为 `${type}${递增ID}${随机字符串}` 的唯一标识符
 */
export function getUID(type = ''): string {
  id++;
  return `${type}${id}${Math.random().toString(36).substring(2, 9)}`;
}

const canvas = document.createElement('canvas');
canvas.width = 1;
canvas.height = 1;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

/**
 * 创建一个可重复的图案
 * @param img - 源图像
 * @param repetition - 图案的重复方式
 * @returns 创建的 Canvas 图案对象
 */
export function createPattern(img: CanvasImageSource, repetition: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y') {
  return ctx.createPattern(img, repetition) as CanvasPattern;
}

/**
 * 从 URL 创建一个可重复的图案
 * @param url - 图像的 URL 地址
 * @param repetition - 图案的重复方式
 * @returns Promise，解析为创建的 Canvas 图案对象
 */
export function createPatternFromUrl(url: string, repetition: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y') {
  return new Promise<CanvasPattern>((resolve) => {
    const img = new Image();
    img.src = url;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve(ctx.createPattern(img, repetition) as CanvasPattern);
    };
  });
}

/**
 * 创建一个线性渐变
 * @param position - 渐变的起点和终点位置配置
 * @param colorStops - 渐变的颜色停止点数组
 * @returns Canvas 线性渐变对象
 */
export function createLinearGradient(
  position: { startX: number; startY: number; endX: number; endY: number },
  colorStops: { offset: number; color: string }[]
) {
  const grd = ctx.createLinearGradient(position.startX, position.startY, position.endX, position.endY);
  for (const color of colorStops) {
    grd.addColorStop(color.offset, color.color);
  }
  return grd;
}

/**
 * 创建一个径向渐变
 * @param position - 渐变的内圆和外圆位置及半径配置
 * @param colorStops - 渐变的颜色停止点数组
 * @returns Canvas 径向渐变对象
 */
export function createRadialGradient(
  position: { startX: number; startY: number; startRadius: number; endX: number; endY: number; endRadius: number },
  colorStops: { offset: number; color: string }[]
) {
  const grd = ctx.createRadialGradient(
    position.startX,
    position.startY,
    position.startRadius,
    position.endX,
    position.endY,
    position.endRadius
  );
  for (const color of colorStops) {
    grd.addColorStop(color.offset, color.color);
  }
  return grd;
}

/**
 * 创建一个指定尺寸的 Canvas 元素
 * @param width - Canvas 的宽度，默认为 100 像素
 * @param height - Canvas 的高度，默认为 100 像素
 * @returns 新创建的 Canvas 元素
 */
export function createCanvas(width = 100, height = 100): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * 获取 URL 的根路径
 * @param url - 输入的 URL 字符串
 * @returns 以斜杠结尾的根路径字符串
 */
export function getPathRoot(url: string): string {
  const arr = url.split('/');
  arr.pop();
  return `${arr.join('/')}/`;
}

/**
 * 等待指定的秒数
 * @param seconds - 需要等待的秒数
 * @returns 在指定秒数后解析的 Promise
 */
export function wait(seconds: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

/**
 * 等待下一帧渲染完成
 * @returns 在下一帧渲染后解析的 Promise
 */
export function waitNextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    Timer.callLater(() => resolve());
  });
}

/**
 * 深拷贝 JSON 对象
 * @param json - 要克隆的 JSON 对象
 * @returns 克隆后的新对象
 */
export function cloneJson<T>(json: T): T {
  const str = JSON.stringify(json);
  return JSON.parse(str);
}

/**
 * 根据脚本数据创建脚本实例
 * @param data - 包含脚本配置的数据对象
 * @returns 创建的脚本实例，如果创建失败则返回 undefined
 */
export function createScript(data: IScriptData): BaseScript | undefined {
  const script = createScriptInstance(data.script);
  if (script) {
    script.id = data.id;
    script.setProps(data.props);
  }
  return script;
}

/**
 * 根据节点数据，创建节点实例
 * @param data - 节点数据
 * @returns 节点实例，如果创建失败则返回 undefined
 */
export function createNode(data: INodeData) {
  const node = createNodeInstance(data.type);
  if (node) {
    node.id = data.id;
    node.fromJson(data);
  }
  return node;
}
