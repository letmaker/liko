import type { IPoint } from '../math/point';
import type { ColorData } from '../utils/color';
import { type INodeOptions, LikoNode } from './node';

interface ILineOptions {
  points: IPoint[];
  color: ColorData;
  lineWidth?: number;
}

interface IRectOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: ColorData;
  stroke?: ColorData;
  strokeWidth?: number;
}

interface ICircleOptions {
  x: number;
  y: number;
  radius: number;
  fill?: ColorData;
  stroke?: ColorData;
  strokeWidth?: number;
}

interface IPolygonOptions {
  points: IPoint[];
  fill?: ColorData;
  stroke?: ColorData;
  strokeWidth?: number;
}

export interface IShapeOptions extends INodeOptions {
  drawLine?: ILineOptions;
  drawRect?: IRectOptions;
  drawCircle?: ICircleOptions;
  drawPolygon?: IPolygonOptions;
}

export class Shape extends LikoNode {
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
      case 'drawPolygon':
        this.drawPolygon(value as IPolygonOptions);
        break;
      default:
        super._$setProp(key, value);
    }
  }

  drawLine(options: ILineOptions): this {
    if (options.points.length < 2) {
      throw new Error('points must be at least 2');
    }
    return this;
  }

  drawRect(options: IRectOptions): this {
    if (!options.fill && !options.stroke) {
      throw new Error('fill or stroke is required');
    }
    console.log(options);
    return this;
  }

  drawCircle(options: ICircleOptions): this {
    if (!options.fill && !options.stroke) {
      throw new Error('fill or stroke is required');
    }
    return this;
  }

  drawPolygon(options: IPolygonOptions): this {
    if (!options.fill && !options.stroke) {
      throw new Error('fill or stroke is required');
    }
    return this;
  }
}
