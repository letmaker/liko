import type { Batch } from '../batch/batch';
import type { IndexBuffer } from '../buffer/index-buffer';
import type { VertexBuffer } from '../buffer/vertex-buffer';

export interface IRenderObject {
  readonly vertexSize: number;
  readonly indexSize: number;
  readonly colorSize: number;
  readonly uvSize: number;

  vertexStart: number;
  indexStart: number;
  colorStart: number;
  uvStart: number;

  batch?: Batch;
  textureId: number;

  packVertex(vertexBuffer: VertexBuffer): void;
  packIndex(indexBuffer: IndexBuffer): void;
  packColor(vertexBuffer: VertexBuffer): void;
  packUV(vertexBuffer: VertexBuffer): void;
}
