import type { IPoint } from '../../math/point';
import type {
  ICircleOptions,
  IEllipseOptions,
  ILineOptions,
  IPolygonOptions,
  IRectOptions,
  IRoundedRectOptions,
  Shape,
} from '../../nodes/shape';
import { Color } from '../../utils/color';
import type { Batch } from '../batch/batch';
import type { IndexBuffer } from '../buffer/index-buffer';
import type { VertexBuffer } from '../buffer/vertex-buffer';
import { useWebGpu } from '../device/device';
import type { IRenderObject } from './render-object';

export class ShapeObject implements IRenderObject {
  // 优化：使用平铺数组而非对象数组，提升性能
  private _vertices: number[] = []; // [x1, y1, x2, y2, ...]
  private _indices: number[] = [];
  private _colors: number[] = [];
  private _geometryDirty = true;

  vertexStart = 0;
  indexStart = 0;
  colorStart = 0;
  uvStart = 0;

  batch?: Batch;
  textureId = 0;

  constructor(public node: Shape) {}

  get vertexSize(): number {
    this.generateGeometry(); // 确保几何数据是最新的
    return this._vertices.length;
  }

  get indexSize(): number {
    this.generateGeometry();
    return this._indices.length;
  }

  get colorSize(): number {
    this.generateGeometry();
    return this._vertices.length * 0.5;
  }

  get uvSize(): number {
    this.generateGeometry();
    return this._vertices.length * 0.5 * 3;
  }

  /**
   * 标记几何数据需要重新生成
   */
  markGeometryDirty(): void {
    this._geometryDirty = true;
  }

  /**
   * 生成形状的顶点数据（延迟生成，只在需要时计算）
   */
  generateGeometry(): void {
    if (!this._geometryDirty) return;

    // 清空现有数据
    this._vertices.length = 0;
    this._indices.length = 0;
    this._colors.length = 0;

    const { drawRect, drawCircle, drawEllipse, drawRoundedRect, drawLine, drawPolygon } = this.node.pp;

    // 根据形状类型生成几何体
    if (drawRect) this._generateRect(drawRect);
    if (drawCircle) this._generateCircle(drawCircle);
    if (drawEllipse) this._generateEllipse(drawEllipse);
    if (drawRoundedRect) this._generateRoundedRect(drawRoundedRect);
    if (drawLine) this._generateLine(drawLine);
    if (drawPolygon) this._generatePolygon(drawPolygon);

    this._geometryDirty = false;
  }

  private _generateRect(options: IRectOptions): void {
    const { x, y, width, height, fill, stroke, strokeWidth = 1 } = options;

    if (fill) {
      const fillColor = new Color(fill).abgr;
      this._addQuad(x, y, x + width, y, x + width, y + height, x, y + height, fillColor);
    }

    if (stroke) {
      const strokeColor = new Color(stroke).abgr;
      this._addRectStroke(x, y, width, height, strokeWidth, strokeColor);
    }
  }

  private _generateCircle(options: ICircleOptions): void {
    const { x, y, radius, fill, stroke, strokeWidth = 1 } = options;
    // 进一步优化段数：更圆润的圆形
    const segments = Math.max(24, Math.min(64, Math.floor(radius / 1.5)));

    if (fill) {
      const fillColor = new Color(fill).abgr;
      this._addCircleFill(x, y, radius, segments, fillColor);
    }

    if (stroke) {
      const strokeColor = new Color(stroke).abgr;
      this._addCircleStroke(x, y, radius, segments, strokeWidth, strokeColor);
    }
  }

  private _generateEllipse(options: IEllipseOptions): void {
    const { x, y, radiusX, radiusY, fill, stroke, strokeWidth = 1 } = options;
    // 优化：提取平均半径计算
    const avgRadius = (radiusX + radiusY) * 0.5;
    const segments = Math.max(24, Math.min(64, Math.floor(avgRadius / 1.5)));

    if (fill) {
      const fillColor = new Color(fill).abgr;
      this._addEllipseFill(x, y, radiusX, radiusY, segments, fillColor);
    }

    if (stroke) {
      const strokeColor = new Color(stroke).abgr;
      this._addEllipseStroke(x, y, radiusX, radiusY, segments, strokeWidth, strokeColor);
    }
  }

  private _generateRoundedRect(options: IRoundedRectOptions): void {
    const { x, y, width, height, cornerRadius, fill, stroke, strokeWidth = 1 } = options;

    // 优化：提前计算有效半径
    const maxRadius = Math.min(width, height) * 0.5;
    const radius = Math.min(cornerRadius, maxRadius);

    if (fill) {
      const fillColor = new Color(fill).abgr;
      this._addRoundedRectFill(x, y, width, height, radius, fillColor);
    }

    if (stroke) {
      const strokeColor = new Color(stroke).abgr;
      this._addRoundedRectStroke(x, y, width, height, radius, strokeWidth, strokeColor);
    }
  }

  private _generateLine(options: ILineOptions): void {
    const { points, color, lineWidth = 1 } = options;
    const lineColor = new Color(color).abgr;

    // 优化：使用for循环减少数组访问
    for (let i = 0, len = points.length - 1; i < len; i++) {
      this._addLineSegment(points[i], points[i + 1], lineWidth, lineColor);
    }
  }

  private _generatePolygon(options: IPolygonOptions): void {
    const { points, fill, stroke, strokeWidth = 1 } = options;

    if (fill && points.length >= 3) {
      const fillColor = new Color(fill).abgr;
      this._addPolygonFill(points, fillColor);
    }

    if (stroke && points.length >= 2) {
      const strokeColor = new Color(stroke).abgr;
      this._addPolygonStroke(points, strokeWidth, strokeColor);
    }
  }

  // 优化：直接操作平铺数组，减少对象创建
  private _addQuad(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number,
    color: number
  ): void {
    const vertexIndex = this._vertices.length * 0.5;

    // 添加顶点 (平铺格式)
    this._vertices.push(x1, y1, x2, y2, x3, y3, x4, y4);
    this._colors.push(color, color, color, color);

    // 添加索引 (两个三角形)
    this._indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2, vertexIndex, vertexIndex + 2, vertexIndex + 3);
  }

  private _addRectStroke(
    x: number,
    y: number,
    width: number,
    height: number,
    strokeWidth: number,
    color: number
  ): void {
    const halfStroke = strokeWidth * 0.5;

    // 优化：预计算边界点，减少重复计算
    const left = x + halfStroke;
    const right = x + width - halfStroke;
    const top = y + halfStroke;
    const bottom = y + height - halfStroke;

    this._addLineSegment({ x: left, y: top }, { x: right, y: top }, strokeWidth, color);
    this._addLineSegment({ x: right, y: top }, { x: right, y: bottom }, strokeWidth, color);
    this._addLineSegment({ x: right, y: bottom }, { x: left, y: bottom }, strokeWidth, color);
    this._addLineSegment({ x: left, y: bottom }, { x: left, y: top }, strokeWidth, color);
  }

  private _addCircleFill(x: number, y: number, radius: number, segments: number, color: number): void {
    const vertexIndex = this._vertices.length * 0.5;

    // 添加中心点
    this._vertices.push(x, y);
    this._colors.push(color);

    // 添加圆周点
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      this._vertices.push(px, py);
      this._colors.push(color);
    }

    // 添加三角形索引
    for (let i = 0; i < segments; i++) {
      this._indices.push(vertexIndex, vertexIndex + i + 1, vertexIndex + i + 2);
    }
  }

  private _addCircleStroke(
    x: number,
    y: number,
    radius: number,
    segments: number,
    strokeWidth: number,
    color: number
  ): void {
    // 内置边框：边框在圆的内部，使用内半径
    const innerRadius = Math.max(0, radius - strokeWidth * 0.5);
    const points: IPoint[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push({
        x: x + Math.cos(angle) * innerRadius,
        y: y + Math.sin(angle) * innerRadius,
      });
    }

    for (let i = 0; i < points.length - 1; i++) {
      this._addLineSegment(points[i], points[i + 1], strokeWidth, color);
    }
  }

  private _addEllipseFill(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    segments: number,
    color: number
  ): void {
    const vertexIndex = this._vertices.length * 0.5;

    // 添加中心点
    this._vertices.push(x, y);
    this._colors.push(color);

    // 添加椭圆周点
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const px = x + Math.cos(angle) * radiusX;
      const py = y + Math.sin(angle) * radiusY;
      this._vertices.push(px, py);
      this._colors.push(color);
    }

    // 添加三角形索引
    for (let i = 0; i < segments; i++) {
      this._indices.push(vertexIndex, vertexIndex + i + 1, vertexIndex + i + 2);
    }
  }

  private _addEllipseStroke(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    segments: number,
    strokeWidth: number,
    color: number
  ): void {
    // 内置边框：边框在椭圆内部，使用内半径
    const innerRadiusX = Math.max(0, radiusX - strokeWidth * 0.5);
    const innerRadiusY = Math.max(0, radiusY - strokeWidth * 0.5);

    const angleStep = (Math.PI * 2) / segments;
    const points: IPoint[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = i * angleStep;
      points.push({
        x: x + Math.cos(angle) * innerRadiusX,
        y: y + Math.sin(angle) * innerRadiusY,
      });
    }

    for (let i = 0; i < points.length - 1; i++) {
      this._addLineSegment(points[i], points[i + 1], strokeWidth, color);
    }
  }

  private _addRoundedRectFill(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: number
  ): void {
    if (radius === 0) {
      // 退化为普通矩形
      this._addQuad(x, y, x + width, y, x + width, y + height, x, y + height, color);
      return;
    }

    // 优化段数：更平滑的圆角
    const segments = Math.max(6, Math.min(16, Math.floor(radius / 1.5)));

    // 优化：预计算尺寸
    const doubleRadius = radius * 2;

    // 使用简化的矩形+圆角方法，而不是复杂的扇形三角化
    // 创建主体矩形
    if (width > doubleRadius) {
      this._addQuad(
        x + radius,
        y,
        x + width - radius,
        y,
        x + width - radius,
        y + height,
        x + radius,
        y + height,
        color
      );
    }
    if (height > doubleRadius) {
      this._addQuad(
        x,
        y + radius,
        x + radius,
        y + radius,
        x + radius,
        y + height - radius,
        x,
        y + height - radius,
        color
      );
      this._addQuad(
        x + width - radius,
        y + radius,
        x + width,
        y + radius,
        x + width,
        y + height - radius,
        x + width - radius,
        y + height - radius,
        color
      );
    }

    // 优化：使用常量定义角度
    const PI = Math.PI;
    const corners = [
      { x: x + radius, y: y + radius, startAngle: PI, endAngle: PI * 1.5 }, // 左上
      { x: x + width - radius, y: y + radius, startAngle: PI * 1.5, endAngle: PI * 2 }, // 右上
      { x: x + width - radius, y: y + height - radius, startAngle: 0, endAngle: PI * 0.5 }, // 右下
      { x: x + radius, y: y + height - radius, startAngle: PI * 0.5, endAngle: PI }, // 左下
    ];

    // 为每个圆角创建简单的扇形
    for (const corner of corners) {
      const centerIndex = this._vertices.length * 0.5;
      this._vertices.push(corner.x, corner.y);
      this._colors.push(color);

      for (let i = 0; i <= segments; i++) {
        const angle = corner.startAngle + (i / segments) * (corner.endAngle - corner.startAngle);
        const px = corner.x + Math.cos(angle) * radius;
        const py = corner.y + Math.sin(angle) * radius;
        this._vertices.push(px, py);
        this._colors.push(color);
      }

      // 添加三角形索引
      for (let i = 0; i < segments; i++) {
        this._indices.push(centerIndex, centerIndex + i + 1, centerIndex + i + 2);
      }
    }
  }

  private _addRoundedRectStroke(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    strokeWidth: number,
    color: number
  ): void {
    if (radius === 0) {
      // 退化为普通矩形描边
      this._addRectStroke(x, y, width, height, strokeWidth, color);
      return;
    }

    const segments = Math.max(6, Math.min(16, Math.floor(radius / 1.5)));
    const halfStroke = strokeWidth * 0.5;

    // 内置边框：调整内半径和边界
    const innerRadius = Math.max(0, radius - halfStroke);
    const innerX = x + halfStroke;
    const innerY = y + halfStroke;
    const innerWidth = width - strokeWidth;
    const innerHeight = height - strokeWidth;

    // 四个圆角的中心点（内置）
    const corners = [
      { x: innerX + innerRadius, y: innerY + innerRadius, startAngle: Math.PI, endAngle: Math.PI * 1.5 }, // 左上
      {
        x: innerX + innerWidth - innerRadius,
        y: innerY + innerRadius,
        startAngle: Math.PI * 1.5,
        endAngle: Math.PI * 2,
      }, // 右上
      {
        x: innerX + innerWidth - innerRadius,
        y: innerY + innerHeight - innerRadius,
        startAngle: 0,
        endAngle: Math.PI * 0.5,
      }, // 右下
      { x: innerX + innerRadius, y: innerY + innerHeight - innerRadius, startAngle: Math.PI * 0.5, endAngle: Math.PI }, // 左下
    ];

    // 直线段（内置）
    const straightSegments = [
      [
        { x: innerX + innerRadius, y: innerY },
        { x: innerX + innerWidth - innerRadius, y: innerY },
      ], // 上边
      [
        { x: innerX + innerWidth, y: innerY + innerRadius },
        { x: innerX + innerWidth, y: innerY + innerHeight - innerRadius },
      ], // 右边
      [
        { x: innerX + innerWidth - innerRadius, y: innerY + innerHeight },
        { x: innerX + innerRadius, y: innerY + innerHeight },
      ], // 下边
      [
        { x: innerX, y: innerY + innerHeight - innerRadius },
        { x: innerX, y: innerY + innerRadius },
      ], // 左边
    ];

    // 绘制直线段
    for (const segment of straightSegments) {
      this._addLineSegment(segment[0], segment[1], strokeWidth, color);
    }

    // 绘制圆角
    for (const corner of corners) {
      const points: IPoint[] = [];
      for (let i = 0; i <= segments; i++) {
        const angle = corner.startAngle + (i / segments) * (corner.endAngle - corner.startAngle);
        points.push({
          x: corner.x + Math.cos(angle) * innerRadius,
          y: corner.y + Math.sin(angle) * innerRadius,
        });
      }

      for (let i = 0; i < points.length - 1; i++) {
        this._addLineSegment(points[i], points[i + 1], strokeWidth, color);
      }
    }
  }

  private _addLineSegment(p1: IPoint, p2: IPoint, width: number, color: number): void {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) return;

    // 优化：避免开方运算，直接使用长度平方
    const length = Math.sqrt(lengthSq);
    const invLength = 1 / length;
    const nx = -dy * invLength;
    const ny = dx * invLength;
    const halfWidth = width * 0.5;

    this._addQuad(
      p1.x + nx * halfWidth,
      p1.y + ny * halfWidth,
      p2.x + nx * halfWidth,
      p2.y + ny * halfWidth,
      p2.x - nx * halfWidth,
      p2.y - ny * halfWidth,
      p1.x - nx * halfWidth,
      p1.y - ny * halfWidth,
      color
    );
  }

  private _addPolygonFill(points: IPoint[], color: number): void {
    if (points.length < 3) return;

    const vertexIndex = this._vertices.length * 0.5;

    // 添加所有点
    for (const point of points) {
      this._vertices.push(point.x, point.y);
      this._colors.push(color);
    }

    // 扇形三角化
    for (let i = 1; i < points.length - 1; i++) {
      this._indices.push(vertexIndex, vertexIndex + i, vertexIndex + i + 1);
    }
  }

  private _addPolygonStroke(points: IPoint[], strokeWidth: number, color: number): void {
    if (points.length < 3) return;

    // 内置边框：计算向内偏移的多边形
    const offsetPoints = this._getInsetPolygonPoints(points, strokeWidth * 0.5);

    for (let i = 0; i < offsetPoints.length; i++) {
      const p1 = offsetPoints[i];
      const p2 = offsetPoints[(i + 1) % offsetPoints.length];
      this._addLineSegment(p1, p2, strokeWidth, color);
    }
  }

  /**
   * 计算多边形向内偏移的点
   */
  private _getInsetPolygonPoints(points: IPoint[], insetDistance: number): IPoint[] {
    if (insetDistance <= 0 || points.length < 3) return points;

    // 首先判断多边形的方向（顺时针还是逆时针）
    const isClockwise = this._isPolygonClockwise(points);
    const insetPoints: IPoint[] = [];
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const prev = points[(i - 1 + n) % n];
      const curr = points[i];
      const next = points[(i + 1) % n];

      // 计算两条边的向量
      const edge1 = { x: curr.x - prev.x, y: curr.y - prev.y };
      const edge2 = { x: next.x - curr.x, y: next.y - curr.y };

      // 计算两条边的向内法向量
      let normal1: { x: number; y: number };
      let normal2: { x: number; y: number };
      if (isClockwise) {
        // 顺时针：向右旋转90度得到向内法向量
        normal1 = { x: edge1.y, y: -edge1.x };
        normal2 = { x: edge2.y, y: -edge2.x };
      } else {
        // 逆时针：向左旋转90度得到向内法向量
        normal1 = { x: -edge1.y, y: edge1.x };
        normal2 = { x: -edge2.y, y: edge2.x };
      }

      // 归一化法向量
      const len1 = Math.sqrt(normal1.x * normal1.x + normal1.y * normal1.y);
      const len2 = Math.sqrt(normal2.x * normal2.x + normal2.y * normal2.y);

      if (len1 > 0) {
        normal1.x /= len1;
        normal1.y /= len1;
      }
      if (len2 > 0) {
        normal2.x /= len2;
        normal2.y /= len2;
      }

      // 计算角平分线方向（向内）
      let bisector = { x: normal1.x + normal2.x, y: normal1.y + normal2.y };
      let bisectorLen = Math.sqrt(bisector.x * bisector.x + bisector.y * bisector.y);

      if (bisectorLen < 0.001) {
        // 如果两个法向量相反（180度角），使用其中一个
        bisector = normal1;
        bisectorLen = 1;
      } else {
        bisector.x /= bisectorLen;
        bisector.y /= bisectorLen;
      }

      // 计算角度修正因子
      const cosHalfAngle = Math.abs(normal1.x * normal2.x + normal1.y * normal2.y);
      const sinHalfAngle = Math.sqrt(Math.max(0, 1 - cosHalfAngle * cosHalfAngle));
      const factor = sinHalfAngle > 0.001 ? 1 / sinHalfAngle : 1;

      // 限制偏移距离，避免过度偏移
      const maxOffset = Math.min(insetDistance * factor, insetDistance * 10);

      insetPoints.push({
        x: curr.x + bisector.x * maxOffset,
        y: curr.y + bisector.y * maxOffset,
      });
    }

    return insetPoints;
  }

  /**
   * 判断多边形是否为顺时针方向
   */
  private _isPolygonClockwise(points: IPoint[]): boolean {
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
      const curr = points[i];
      const next = points[(i + 1) % points.length];
      sum += (next.x - curr.x) * (next.y + curr.y);
    }
    return sum > 0;
  }

  packVertex(vertexBuffer: VertexBuffer): void {
    this.generateGeometry(); // 延迟生成

    const { vertexStart } = this;
    const { f32Data } = vertexBuffer;
    const transform = this.node.pp.worldMatrix;

    // 优化：解构变换矩阵，减少属性访问
    const { a, b, c, d, tx, ty } = transform;

    // 优化：批量处理顶点变换
    for (let i = 0; i < this._vertices.length; i += 2) {
      const localX = this._vertices[i];
      const localY = this._vertices[i + 1];

      f32Data[vertexStart + i] = a * localX + c * localY + tx;
      f32Data[vertexStart + i + 1] = b * localX + d * localY + ty;
    }
  }

  packIndex(indexBuffer: IndexBuffer): void {
    const { indexStart } = this;
    const { data: indexData } = indexBuffer;

    // 优化：预计算顶点偏移
    const vertexOffset = this.vertexStart * 0.5;

    // 批量复制索引，加上正确的顶点偏移
    for (let i = 0; i < this._indices.length; i++) {
      indexData[indexStart + i] = this._indices[i] + vertexOffset;
    }
  }

  packColor(vertexBuffer: VertexBuffer): void {
    const { colorStart } = this;
    const { u32Data } = vertexBuffer;
    const tintColor = this.node.pp.tintColor;

    for (let i = 0, len = this._colors.length; i < len; i++) {
      const shapeColor = this._colors[i];

      if (tintColor.abgr === -1) {
        // 优化：如果是默认tint颜色，直接使用形状颜色
        u32Data[colorStart + i] = shapeColor;
      } else {
        // 优化：直接使用Color对象的属性，避免位运算
        const globalA = tintColor.alpha;
        const globalR = tintColor.red;
        const globalG = tintColor.green;
        const globalB = tintColor.blue;

        // 颜色混合
        const shapeA = ((shapeColor >>> 24) & 0xff) / 255;
        const shapeB = ((shapeColor >>> 16) & 0xff) / 255; // ABGR格式中B在第16位
        const shapeG = ((shapeColor >>> 8) & 0xff) / 255; // G在第8位
        const shapeR = (shapeColor & 0xff) / 255; // R在第0位

        const finalA = Math.round(shapeA * globalA * 255);
        const finalR = Math.round(shapeR * globalR * 255);
        const finalG = Math.round(shapeG * globalG * 255);
        const finalB = Math.round(shapeB * globalB * 255);

        // 修复字节序问题：WebGPU需要ABGR格式而不是ARGB
        u32Data[colorStart + i] = (finalA << 24) | (finalB << 16) | (finalG << 8) | finalR;
      }
    }
  }

  packUV(vertexBuffer: VertexBuffer): void {
    const { uvStart } = this;
    const { f32Data, u32Data } = vertexBuffer;
    const textureData = useWebGpu ? u32Data : f32Data;
    const vertexCount = this._vertices.length * 0.5;
    const textureId = this.textureId;

    // 优化：批量设置UV数据，减少重复计算
    const uvStride = 3;
    for (let i = 0; i < vertexCount; i++) {
      const uvIndex = uvStart + i * uvStride;
      f32Data[uvIndex] = 0.5; // u
      f32Data[uvIndex + 1] = 0.5; // v
      textureData[uvIndex + 2] = textureId; // textureId
    }
  }
}
