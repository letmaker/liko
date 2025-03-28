import type { IndexBuffer } from "../buffer/index-buffer";
import type { VertexBuffer } from "../buffer/vertex-buffer";
import type { IRenderable } from "../../nodes/sprite";
import type { Batch } from "../batch/batch";
import { useWebGpu } from "../device/device";

export class SpriteObject {
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

  // pack(vertexBuffer: VertexBuffer, indexBuffer: IndexBuffer) {
  //   const { node } = this;
  //   const { vertexStart, indexStart, textureId } = this;
  //   const { f32Data, u32Data } = vertexBuffer;
  //   const { data: indexData } = indexBuffer;
  //   const { width, height } = node.texture;
  //   const wt = node.pp.worldMatrix;
  //   const color = node.pp.color.argb;
  //   const sx = node.width / width;
  //   const sy = node.height / height;

  //   const a = wt.a * sx;
  //   const b = wt.b * sx;
  //   const c = wt.c * sy;
  //   const d = wt.d * sy;
  //   const tx = wt.tx;
  //   const ty = wt.ty;

  //   const trim = node.texture.trim;
  //   const w0 = trim.width;
  //   const w1 = trim.x;
  //   const h0 = trim.height;
  //   const h1 = trim.y;

  //   const uvs = node.texture.uvs;

  //   // newPos.x = a * width + c * height + tx;
  //   // newPos.y = b * width + d * height + ty;

  //   // x,y,u,v,color,id
  //   // 0, 0, 0, 0
  //   f32Data[vertexStart] = a * w1 + c * h1 + tx;
  //   f32Data[vertexStart + 1] = d * h1 + b * w1 + ty;
  //   f32Data[vertexStart + 2] = uvs.x0;
  //   f32Data[vertexStart + 3] = uvs.y0;
  //   u32Data[vertexStart + 4] = color;
  //   u32Data[vertexStart + 5] = textureId;

  //   // width, 0, 1, 0
  //   f32Data[vertexStart + 6] = a * w0 + c * h1 + tx;
  //   f32Data[vertexStart + 7] = d * h1 + b * w0 + ty;
  //   f32Data[vertexStart + 8] = uvs.x1;
  //   f32Data[vertexStart + 9] = uvs.y1;
  //   u32Data[vertexStart + 10] = color;
  //   u32Data[vertexStart + 11] = textureId;

  //   // width, height, 1, 1
  //   f32Data[vertexStart + 12] = a * w0 + c * h0 + tx;
  //   f32Data[vertexStart + 13] = d * h0 + b * w0 + ty;
  //   f32Data[vertexStart + 14] = uvs.x2;
  //   f32Data[vertexStart + 15] = uvs.y2;
  //   u32Data[vertexStart + 16] = color;
  //   u32Data[vertexStart + 17] = textureId;

  //   // 0, height, 0, 1
  //   f32Data[vertexStart + 18] = a * w1 + c * h0 + tx;
  //   f32Data[vertexStart + 19] = d * h0 + b * w1 + ty;
  //   f32Data[vertexStart + 20] = uvs.x3;
  //   f32Data[vertexStart + 21] = uvs.y3;
  //   u32Data[vertexStart + 22] = color;
  //   u32Data[vertexStart + 23] = textureId;

  //   // 索引
  //   const indexOffset = vertexStart / this.indexSize;
  //   indexData[indexStart] = indexOffset + 0;
  //   indexData[indexStart + 1] = indexOffset + 1;
  //   indexData[indexStart + 2] = indexOffset + 2;
  //   indexData[indexStart + 3] = indexOffset + 0;
  //   indexData[indexStart + 4] = indexOffset + 2;
  //   indexData[indexStart + 5] = indexOffset + 3;
  // }

  packVertex(vertexBuffer: VertexBuffer) {
    const { node, vertexStart } = this;
    const { f32Data } = vertexBuffer;
    const { width, height } = node.texture;
    const wt = node.pp.worldMatrix;
    const sx = node.width / width;
    const sy = node.height / height;

    const a = wt.a * sx;
    const b = wt.b * sx;
    const c = wt.c * sy;
    const d = wt.d * sy;
    const tx = wt.tx;
    const ty = wt.ty;

    const trim = node.texture.trim;
    const w0 = trim.width;
    const w1 = trim.x;
    const h0 = trim.height;
    const h1 = trim.y;

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

    // 索引
    const indexOffset = (indexStart / this.indexSize) * 4;
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
    const color = node.pp.color.argb;

    // color
    u32Data[colorStart] = color;
    u32Data[colorStart + 1] = color;
    u32Data[colorStart + 2] = color;
    u32Data[colorStart + 3] = color;
  }

  packUV(vertexBuffer: VertexBuffer) {
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
}
