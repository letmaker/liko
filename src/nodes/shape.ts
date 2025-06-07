import { DirtyType } from '../const';
import type { IPoint } from '../math/point';
import { ShapeObject } from '../render/render/shape-object';
import { Texture } from '../resource/texture';
import type { ColorData } from '../utils/color';
import { RegNode } from '../utils/decorators';
import { type INodeOptions, type INodePrivateProps, LikoNode } from './node';
import type { IRenderable } from './sprite';

/**
 * 线条绘制选项接口
 */
export interface ILineOptions {
  /** 线条的点集合，至少需要2个点 */
  points: IPoint[];
  /** 线条颜色 */
  color: ColorData;
  /** 线条宽度，可选参数 */
  lineWidth?: number;
}

/**
 * 矩形绘制选项接口
 */
export interface IRectOptions {
  /** 矩形左上角X坐标 */
  x: number;
  /** 矩形左上角Y坐标 */
  y: number;
  /** 矩形宽度 */
  width: number;
  /** 矩形高度 */
  height: number;
  /** 填充颜色，可选 */
  fill?: ColorData;
  /** 描边颜色，可选 */
  stroke?: ColorData;
  /** 描边宽度，可选 */
  strokeWidth?: number;
}

/**
 * 圆角矩形绘制选项接口
 */
export interface IRoundedRectOptions {
  /** 圆角矩形左上角X坐标 */
  x: number;
  /** 圆角矩形左上角Y坐标 */
  y: number;
  /** 圆角矩形宽度 */
  width: number;
  /** 圆角矩形高度 */
  height: number;
  /** 圆角半径 */
  cornerRadius: number;
  /** 填充颜色，可选 */
  fill?: ColorData;
  /** 描边颜色，可选 */
  stroke?: ColorData;
  /** 描边宽度，可选 */
  strokeWidth?: number;
}

/**
 * 圆形绘制选项接口
 */
export interface ICircleOptions {
  /** 圆心X坐标 */
  x: number;
  /** 圆心Y坐标 */
  y: number;
  /** 圆形半径 */
  radius: number;
  /** 填充颜色，可选 */
  fill?: ColorData;
  /** 描边颜色，可选 */
  stroke?: ColorData;
  /** 描边宽度，可选 */
  strokeWidth?: number;
}

/**
 * 椭圆绘制选项接口
 */
export interface IEllipseOptions {
  /** 椭圆中心X坐标 */
  x: number;
  /** 椭圆中心Y坐标 */
  y: number;
  /** 椭圆X轴半径 */
  radiusX: number;
  /** 椭圆Y轴半径 */
  radiusY: number;
  /** 填充颜色，可选 */
  fill?: ColorData;
  /** 描边颜色，可选 */
  stroke?: ColorData;
  /** 描边宽度，可选 */
  strokeWidth?: number;
}

/**
 * 多边形绘制选项接口
 */
export interface IPolygonOptions {
  /** 多边形的顶点集合，至少需要3个点 */
  points: IPoint[];
  /** 填充颜色，可选 */
  fill?: ColorData;
  /** 描边颜色，可选 */
  stroke?: ColorData;
  /** 描边宽度，可选 */
  strokeWidth?: number;
}

/**
 * 形状节点选项接口
 */
export interface IShapeOptions extends INodeOptions {
  /** 绘制线条的选项 */
  drawLine?: ILineOptions;
  /** 绘制矩形的选项 */
  drawRect?: IRectOptions;
  /** 绘制圆形的选项 */
  drawCircle?: ICircleOptions;
  /** 绘制椭圆的选项 */
  drawEllipse?: IEllipseOptions;
  /** 绘制圆角矩形的选项 */
  drawRoundedRect?: IRoundedRectOptions;
  /** 绘制多边形的选项 */
  drawPolygon?: IPolygonOptions;

  /** 精灵叠加颜色，用于调整节点的颜色 */
  tintColor?: ColorData;
}

interface IShapePrivateProps extends INodePrivateProps {
  drawLine?: ILineOptions;
  drawRect?: IRectOptions;
  drawCircle?: ICircleOptions;
  drawEllipse?: IEllipseOptions;
  drawRoundedRect?: IRoundedRectOptions;
  drawPolygon?: IPolygonOptions;
}

/**
 * GPU 形状节点类，用于绘制各种基本图形，支持线条、矩形、圆形、椭圆、圆角矩形和多边形的绘制
 *
 * 相比 canvas 类，Shape 类使用 GPU 渲染性能更好，但功能少，canvas功能齐全，抗锯齿效果好，但频繁更新性能差。
 * 不经常变化对效果有更高要求的，建议使用 canvas 类，对性能要求比较高的或频繁变化的，建议使用 Shape 类。
 *
 * @example
 * ```typescript
 * // 创建一个形状节点并绘制矩形
 * const shape = new Shape();
 * shape.drawRect({
 *   x: 10, y: 10, width: 100, height: 50,
 *   fill: 'red', stroke: 'blue', strokeWidth: 2
 * });
 *
 * // 链式调用绘制多个形状
 * shape.drawCircle({ x: 50, y: 50, radius: 20, fill: '#ff0000' })
 *      .drawLine({ points: [{x: 0, y: 0}, {x: 100, y: 100}], color: '#ffff00' });
 * ```
 */
@RegNode('Shape')
export class Shape extends LikoNode implements IRenderable {
  declare pp: IShapePrivateProps;

  /** 渲染对象，负责实际的图形渲染(只读) */
  readonly renderObject: ShapeObject = new ShapeObject(this);

  /** 纹理对象，形状节点固定使用白色纹理(只读) */
  readonly texture: Texture = Texture.WHITE;

  constructor(options?: IShapeOptions) {
    super();
    this.setProps(options as Record<string, unknown>);
  }

  protected override _$setProp(key: string, value: unknown): void {
    switch (key) {
      case 'drawLine':
        this.drawLine(value as ILineOptions);
        break;
      case 'drawRect':
        this.drawRect(value as IRectOptions);
        break;
      case 'drawCircle':
        this.drawCircle(value as ICircleOptions);
        break;
      case 'drawEllipse':
        this.drawEllipse(value as IEllipseOptions);
        break;
      case 'drawRoundedRect':
        this.drawRoundedRect(value as IRoundedRectOptions);
        break;
      case 'drawPolygon':
        this.drawPolygon(value as IPolygonOptions);
        break;
      default:
        super._$setProp(key, value);
    }
  }

  /**
   * 绘制线条，多次调用会覆盖当前形状设置，但不会影响其他形状设置
   * @param options 线条绘制选项
   * @returns 返回当前实例，支持链式调用
   * @throws 当点数少于2个时抛出错误
   */
  drawLine(options: ILineOptions): this {
    this.pp.drawLine = options;
    if (options.points.length < 2) {
      throw new Error('Line points must be at least 2');
    }
    this._markGeometryDirty();
    return this;
  }

  /**
   * 绘制矩形，多次调用会覆盖当前形状设置，但不会影响其他形状设置
   * @param options 矩形绘制选项
   * @returns 返回当前实例，支持链式调用
   * @throws 当矩形没有填充或描边时抛出错误
   * @throws 当宽度或高度不为正数时抛出错误
   */
  drawRect(options: IRectOptions): this {
    this.pp.drawRect = options;
    if (!options.fill && !options.stroke) {
      throw new Error('Rectangle must have fill or stroke');
    }
    if (options.width <= 0 || options.height <= 0) {
      throw new Error('Rectangle width and height must be positive');
    }
    this._markGeometryDirty();
    return this;
  }

  /**
   * 绘制圆形，多次调用会覆盖当前形状设置，但不会影响其他形状设置
   * @param options 圆形绘制选项
   * @returns 返回当前实例，支持链式调用
   * @throws 当圆形没有填充或描边时抛出错误
   * @throws 当半径不为正数时抛出错误
   */
  drawCircle(options: ICircleOptions): this {
    this.pp.drawCircle = options;
    if (!options.fill && !options.stroke) {
      throw new Error('Circle must have fill or stroke');
    }
    if (options.radius <= 0) {
      throw new Error('Circle radius must be positive');
    }
    this._markGeometryDirty();
    return this;
  }

  /**
   * 绘制椭圆，多次调用会覆盖当前形状设置，但不会影响其他形状设置
   * @param options 椭圆绘制选项
   * @returns 返回当前实例，支持链式调用
   * @throws 当椭圆没有填充或描边时抛出错误
   * @throws 当X轴或Y轴半径不为正数时抛出错误
   */
  drawEllipse(options: IEllipseOptions): this {
    this.pp.drawEllipse = options;
    if (!options.fill && !options.stroke) {
      throw new Error('Ellipse must have fill or stroke');
    }
    if (options.radiusX <= 0 || options.radiusY <= 0) {
      throw new Error('Ellipse radiusX and radiusY must be positive');
    }
    this._markGeometryDirty();
    return this;
  }

  /**
   * 绘制圆角矩形，多次调用会覆盖当前形状设置，但不会影响其他形状设置
   * @param options 圆角矩形绘制选项
   * @returns 返回当前实例，支持链式调用
   * @throws 当圆角矩形没有填充或描边时抛出错误
   * @throws 当宽度或高度不为正数时抛出错误
   */
  drawRoundedRect(options: IRoundedRectOptions): this {
    this.pp.drawRoundedRect = options;
    if (!options.fill && !options.stroke) {
      throw new Error('Rounded rectangle must have fill or stroke');
    }
    if (options.width <= 0 || options.height <= 0) {
      throw new Error('Rounded rectangle width and height must be positive');
    }
    this._markGeometryDirty();
    return this;
  }

  /**
   * 绘制多边形，多次调用会覆盖当前形状设置，但不会影响其他形状设置
   * @param options 多边形绘制选项
   * @returns 返回当前实例，支持链式调用
   * @throws 当多边形没有填充或描边时抛出错误
   * @throws 当点数少于3个时抛出错误
   */
  drawPolygon(options: IPolygonOptions): this {
    this.pp.drawPolygon = options;
    if (!options.fill && !options.stroke) {
      throw new Error('Polygon must have fill or stroke');
    }
    if (options.points.length < 3) {
      throw new Error('Polygon must have at least 3 points');
    }
    this._markGeometryDirty();
    return this;
  }

  private _markGeometryDirty(): void {
    this.renderObject.markGeometryDirty();
    this.markDirty(DirtyType.child);
  }
}
