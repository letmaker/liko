import type { IRenderable } from '../../nodes/sprite';
import type { Batch } from '../batch/batch';
import type { IndexBuffer } from '../buffer/index-buffer';
import type { VertexBuffer } from '../buffer/vertex-buffer';
import { useWebGpu } from '../device/device';
import type { IRenderObject } from './render-object';

export class SpriteObject implements IRenderObject {
  readonly vertexSize = 4 * 2;
  readonly indexSize = 6;
  readonly colorSize = 4 * 1;
  readonly uvSize = 4 * 3;

  vertexStart = 0;
  indexStart = 0;
  colorStart = 0;
  uvStart = 0;

  batch?: Batch;
  textureId = 0;

  constructor(public node: IRenderable) {}

  packVertex(vertexBuffer: VertexBuffer) {
    const { node, vertexStart } = this;
    const { f32Data } = vertexBuffer;
    const { width, height, trimRect } = node.texture;
    const { width: nodeWidth, height: nodeHeight } = node.getLocalBounds();
    const wt = node.pp.worldMatrix;
    const sx = nodeWidth / width;
    const sy = nodeHeight / height;

    // console.log("packVertex", node.label, width, height, nodeWidth, nodeHeight);

    const a = wt.a * sx;
    const b = wt.b * sx;
    const c = wt.c * sy;
    const d = wt.d * sy;
    const tx = wt.tx;
    const ty = wt.ty;

    const w0 = trimRect.width;
    const w1 = trimRect.x;
    const h0 = trimRect.height;
    const h1 = trimRect.y;

    // newPos.x = a * width + c * height + tx;
    // newPos.y = b * width + d * height + ty;

    // x,y
    // 0, 0
    f32Data[vertexStart] = a * w1 + c * h1 + tx;
    f32Data[vertexStart + 1] = d * h1 + b * w1 + ty;

    // width, 0
    f32Data[vertexStart + 2] = a * w0 + c * h1 + tx;
    f32Data[vertexStart + 3] = d * h1 + b * w0 + ty;

    // width, height
    f32Data[vertexStart + 4] = a * w0 + c * h0 + tx;
    f32Data[vertexStart + 5] = d * h0 + b * w0 + ty;

    // 0, height
    f32Data[vertexStart + 6] = a * w1 + c * h0 + tx;
    f32Data[vertexStart + 7] = d * h0 + b * w1 + ty;
  }

  packIndex(indexBuffer: IndexBuffer) {
    // TODO: 更换 u16
    const { indexStart } = this;
    const { data: indexData } = indexBuffer;

    const indexOffset = this.vertexStart * 0.5;
    indexData[indexStart] = indexOffset + 0;
    indexData[indexStart + 1] = indexOffset + 1;
    indexData[indexStart + 2] = indexOffset + 2;
    indexData[indexStart + 3] = indexOffset + 0;
    indexData[indexStart + 4] = indexOffset + 2;
    indexData[indexStart + 5] = indexOffset + 3;
  }

  packColor(vertexBuffer: VertexBuffer) {
    // TODO: 更换 u16?
    const { colorStart } = this;
    const { node } = this;
    const { u32Data } = vertexBuffer;
    const color = node.pp.tintColor.abgr;

    // color
    u32Data[colorStart] = color;
    u32Data[colorStart + 1] = color;
    u32Data[colorStart + 2] = color;
    u32Data[colorStart + 3] = color;
  }

  packUV(vertexBuffer: VertexBuffer) {
    if (this.node.texture.repeat) {
      this.packTilingUV(vertexBuffer);
      return;
    }

    // TODO: 更换 f16？
    const { node, uvStart, textureId } = this;
    const { f32Data, u32Data } = vertexBuffer;
    const uvs = node.texture.uvs;
    const textureData = useWebGpu ? u32Data : f32Data;

    // u,v,id
    f32Data[uvStart] = uvs.x0;
    f32Data[uvStart + 1] = uvs.y0;
    textureData[uvStart + 2] = textureId;

    f32Data[uvStart + 3] = uvs.x1;
    f32Data[uvStart + 4] = uvs.y1;
    textureData[uvStart + 5] = textureId;

    f32Data[uvStart + 6] = uvs.x2;
    f32Data[uvStart + 7] = uvs.y2;
    textureData[uvStart + 8] = textureId;

    f32Data[uvStart + 9] = uvs.x3;
    f32Data[uvStart + 10] = uvs.y3;
    textureData[uvStart + 11] = textureId;
  }

  packTilingUV(vertexBuffer: VertexBuffer) {
    // TODO: 更换 f16？
    const { node, uvStart, textureId } = this;
    const { f32Data, u32Data } = vertexBuffer;
    const uvs = node.texture.uvs;
    const textureData = useWebGpu ? u32Data : f32Data;

    // 如果启用了平铺，需要重新计算UV坐标
    const { width: nodeWidth, height: nodeHeight } = node.getLocalBounds();
    const { width: textureWidth, height: textureHeight } = node.texture;

    // 根据节点尺寸和纹理尺寸自动计算平铺倍数
    const tilesX = textureWidth > 0 ? nodeWidth / textureWidth : 1;
    const tilesY = textureHeight > 0 ? nodeHeight / textureHeight : 1;

    // 基于原始UV坐标计算平铺后的UV坐标
    const baseWidth = uvs.x1 - uvs.x0;
    const baseHeight = uvs.y3 - uvs.y0;

    const finalUvs = {
      x0: uvs.x0,
      y0: uvs.y0,
      x1: uvs.x0 + baseWidth * tilesX,
      y1: uvs.y0,
      x2: uvs.x0 + baseWidth * tilesX,
      y2: uvs.y0 + baseHeight * tilesY,
      x3: uvs.x0,
      y3: uvs.y0 + baseHeight * tilesY,
    };

    // u,v,id
    f32Data[uvStart] = finalUvs.x0;
    f32Data[uvStart + 1] = finalUvs.y0;
    textureData[uvStart + 2] = textureId;

    f32Data[uvStart + 3] = finalUvs.x1;
    f32Data[uvStart + 4] = finalUvs.y1;
    textureData[uvStart + 5] = textureId;

    f32Data[uvStart + 6] = finalUvs.x2;
    f32Data[uvStart + 7] = finalUvs.y2;
    textureData[uvStart + 8] = textureId;

    f32Data[uvStart + 9] = finalUvs.x3;
    f32Data[uvStart + 10] = finalUvs.y3;
    textureData[uvStart + 11] = textureId;
  }
}
