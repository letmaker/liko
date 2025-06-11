import { DirtyType } from '../const';
import { Bounds } from '../math/bounds';
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
  bounds: Bounds;
}

/**
 * GPU 形状节点类，用于绘制各种基本图形，支持线条、矩形、圆形、椭圆、圆角矩形和多边形的绘制
 *
 * 相比 canvas 类，Shape 类使用 GPU 渲染性能更好，但功能少，canvas功能齐全，抗锯齿效果好，但频繁更新性能差。
 * 不经常变化对效果有更高要求的，建议使用 canvas 类，对性能要求比较高的或频繁变化的，建议使用 Shape 类。
 *
 * ## 重要注意事项：
 * - 每种形状只能绘制一个，多次调用相同类型的绘制方法会覆盖之前的设置
 * - 形状必须有填充色或描边色至少其中一种，否则会抛出错误
 * - 所有尺寸参数（宽度、高度、半径等）必须为正数
 * - 线条和多边形的点数有最小要求（线条至少2个点，多边形至少3个点）
 * - 支持链式调用，可以在一个节点上绘制多种不同类型的形状
 *
 * ## 基础使用示例：
 * ```typescript
 * // 创建一个形状节点并绘制红色填充的矩形
 * const shape = new Shape();
 * shape.drawRect({
 *   x: 10, y: 10, width: 100, height: 50,
 *   fill: 'red'
 * });
 *
 * // 绘制蓝色描边的圆形
 * shape.drawCircle({
 *   x: 50, y: 50, radius: 20,
 *   stroke: 'blue', strokeWidth: 2
 * });
 * ```
 *
 * ## 链式调用示例：
 * ```typescript
 * const shape = new Shape()
 *   .drawRect({ x: 0, y: 0, width: 100, height: 50, fill: '#ff0000' })
 *   .drawCircle({ x: 150, y: 25, radius: 25, fill: '#00ff00' })
 *   .drawLine({ points: [{x: 0, y: 60}, {x: 200, y: 60}], color: '#0000ff', lineWidth: 3 });
 * ```
 *
 * ## 复杂形状示例：
 * ```typescript
 * // 绘制带圆角的矩形
 * shape.drawRoundedRect({
 *   x: 10, y: 10, width: 100, height: 60,
 *   cornerRadius: 10,
 *   fill: '#ffcc00',
 *   stroke: '#ff6600',
 *   strokeWidth: 2
 * });
 *
 * // 绘制多边形（三角形）
 * shape.drawPolygon({
 *   points: [
 *     { x: 50, y: 0 },
 *     { x: 0, y: 50 },
 *     { x: 100, y: 50 }
 *   ],
 *   fill: '#9966cc',
 *   stroke: '#663399',
 *   strokeWidth: 1
 * });
 *
 * // 绘制椭圆
 * shape.drawEllipse({
 *   x: 50, y: 50,
 *   radiusX: 40, radiusY: 20,
 *   fill: '#66ccff'
 * });
 * ```
 *
 * ## 构造函数选项示例：
 * ```typescript
 * // 在构造时就指定要绘制的形状
 * const shape = new Shape({
 *   x: 100, y: 100,
 *   drawRect: { x: 0, y: 0, width: 50, height: 50, fill: 'red' },
 *   drawCircle: { x: 60, y: 25, radius: 15, fill: 'blue' },
 *   tintColor: '#ffffff' // 叠加颜色
 * });
 * ```
 */
@RegNode('Shape')
export class Shape extends LikoNode implements IRenderable {
  declare pp: IShapePrivateProps;

  /**
   * 渲染对象，负责实际的图形渲染(只读)
   * 这是内部使用的渲染对象，不应该直接操作
   */
  readonly renderObject: ShapeObject = new ShapeObject(this);

  /**
   * 纹理对象，形状节点固定使用白色纹理(只读)
   * Shape 类使用程序化生成的几何图形，不需要外部纹理
   */
  readonly texture: Texture = Texture.WHITE;

  constructor(options?: IShapeOptions) {
    super();
    this.pp.bounds = new Bounds();
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
   * 绘制线条
   *
   * 注意事项：
   * - 点集合至少需要2个点，否则抛出错误
   * - 多次调用会覆盖当前线条设置，但不影响其他形状
   * - 线条只有颜色属性，没有填充和描边的概念
   *
   * @param options 线条绘制选项，包含点集合、颜色和可选的线宽
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
   * 绘制矩形
   *
   * 注意事项：
   * - 必须指定填充色或描边色至少其中一种，否则抛出错误
   * - 宽度和高度必须为正数，否则抛出错误
   * - 多次调用会覆盖当前矩形设置，但不影响其他形状
   * - 坐标(x,y)表示矩形左上角位置
   *
   * @param options 矩形绘制选项，包含位置、尺寸、填充色、描边色等
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
   * 绘制圆形
   *
   * 注意事项：
   * - 必须指定填充色或描边色至少其中一种，否则抛出错误
   * - 半径必须为正数，否则抛出错误
   * - 多次调用会覆盖当前圆形设置，但不影响其他形状
   * - 坐标(x,y)表示圆心位置
   *
   * @param options 圆形绘制选项，包含圆心位置、半径、填充色、描边色等
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
   * 绘制椭圆
   *
   * 注意事项：
   * - 必须指定填充色或描边色至少其中一种，否则抛出错误
   * - X轴和Y轴半径都必须为正数，否则抛出错误
   * - 多次调用会覆盖当前椭圆设置，但不影响其他形状
   * - 坐标(x,y)表示椭圆中心位置
   *
   * @param options 椭圆绘制选项，包含中心位置、X/Y轴半径、填充色、描边色等
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
   * 绘制圆角矩形
   *
   * 注意事项：
   * - 必须指定填充色或描边色至少其中一种，否则抛出错误
   * - 宽度和高度必须为正数，否则抛出错误
   * - 多次调用会覆盖当前圆角矩形设置，但不影响其他形状
   * - 坐标(x,y)表示圆角矩形左上角位置
   * - 圆角半径会自动限制在合理范围内
   *
   * @param options 圆角矩形绘制选项，包含位置、尺寸、圆角半径、填充色、描边色等
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
   * 绘制多边形
   *
   * 注意事项：
   * - 必须指定填充色或描边色至少其中一种，否则抛出错误
   * - 顶点至少需要3个，否则抛出错误
   * - 多次调用会覆盖当前多边形设置，但不影响其他形状
   * - 顶点按顺序连接，自动闭合形成多边形
   * - 建议按逆时针方向提供顶点以获得正确的填充效果
   *
   * @param options 多边形绘制选项，包含顶点集合、填充色、描边色等
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
    this.pp.boundsDirty = true;
    this.renderObject.markGeometryDirty();
    this.markDirty(DirtyType.child);
  }

  private _updateBounds(): void {
    if (!this.pp.boundsDirty) return;

    this.pp.bounds.reset();
    const { drawLine, drawRect, drawCircle, drawEllipse, drawRoundedRect, drawPolygon } = this.pp;
    if (drawLine) {
      const { points } = drawLine;
      for (const point of points) {
        this._addPoint(point.x, point.y);
      }
    }
    if (drawRect) {
      const { x, y, width, height } = drawRect;
      this._addPoint(x, y);
      this._addPoint(x + width, y + height);
    }
    if (drawCircle) {
      const { x, y, radius } = drawCircle;
      this._addPoint(x - radius, y - radius);
      this._addPoint(x + radius, y + radius);
    }
    if (drawEllipse) {
      const { x, y, radiusX, radiusY } = drawEllipse;
      this._addPoint(x - radiusX, y - radiusY);
      this._addPoint(x + radiusX, y + radiusY);
    }
    if (drawRoundedRect) {
      const { x, y, width, height } = drawRoundedRect;
      this._addPoint(x, y);
      this._addPoint(x + width, y + height);
    }
    if (drawPolygon) {
      const { points } = drawPolygon;
      for (const point of points) {
        this._addPoint(point.x, point.y);
      }
    }
  }

  private _addPoint(x: number, y: number): void {
    const { bounds } = this.pp;
    if (x < bounds.minX) bounds.minX = x;
    if (x > bounds.maxX) bounds.maxX = x;
    if (y < bounds.minY) bounds.minY = y;
    if (y > bounds.maxY) bounds.maxY = y;
  }

  protected override _customLocalBounds(bounds: Bounds): void {
    this._updateBounds();
    const { bounds: b } = this.pp;
    bounds.addFrame(b.minX, b.minY, b.maxX, b.maxY);
  }
}
