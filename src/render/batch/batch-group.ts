import { DirtyType } from "../../const";
import type { Matrix } from "../../math/matrix";
import type { Node } from "../../nodes/node";
import type { IRenderable, Sprite } from "../../nodes/sprite";
import { Color } from "../../utils/color";
import type { CameraBuffer } from "../buffer/camera-buffer";
import { IndexBuffer } from "../buffer/index-buffer";
import { VertexBuffer } from "../buffer/vertex-buffer";
import { FilterManager } from "../filter/filter-manager";
import type { SpriteObject } from "../render/sprite-object";
import { getBatchGroupFromCache } from "../utils/cache-manager";
import { Batch } from "./batch";

export type BatchData = Batch | BatchGroup;

export class BatchGroup {
  camera!: CameraBuffer;
  batches: BatchData[] = [];
  nodes: Node[] = [];

  posBuffer = new VertexBuffer("pos");
  colorBuffer = new VertexBuffer("color");
  uvBuffer = new VertexBuffer("uv");
  indexBuffer = new IndexBuffer();
  vertexSize = 0;
  colorSize = 0;
  uvSize = 0;
  indexSize = 0;

  spriteCount = 0;
  updateCount = 0;
  resetCount = 0;

  collect(root: Node, worldMatrix: Matrix, camera: CameraBuffer) {
    if (root.pp.dirty === 0) return this;
    if (root.pp.dirty & DirtyType.child) {
      this.reset();
      this.camera = camera;
      this._collect(root, worldMatrix, root.alpha);
      if (this.spriteCount > 0) {
        this._fat();
        this._batch();
        this._uploadBuffer();
      }
    } else {
      this.update();
    }
    return this;
  }

  update() {
    const count = this.nodes.length;
    if (count < 1 || this.nodes[0].pp.dirty === 0) return;

    this._update();
    this._uploadBuffer();

    for (const batch of this.batches) {
      if (batch instanceof BatchGroup) {
        batch.update();
      }
    }
  }

  private _update() {
    this.updateCount++;
    const count = this.nodes.length;

    let i = 0;
    while (i < count) {
      const node = this.nodes[i];
      i++;

      const { dirty, transform, localMatrix, worldMatrix, pos, parent, color, alpha } = node.pp;
      const tfDirty = dirty & DirtyType.transform;
      const colorDirty = dirty & DirtyType.color;

      // 更新 worldMatrix
      if (tfDirty) {
        transform.updateMatrix(localMatrix, worldMatrix, pos, parent!.worldMatrix);
      }

      // 更新 worldAlpha
      if (colorDirty) {
        if (color === Color.Default) node.pp.color = new Color();
        node.pp.color.changeAlpha(alpha * parent!.pp.color.alpha);
      }

      // TODO： texture的检查是否必须？
      // 检查节点是否有 texture 和 renderObject
      if ("renderObject" in node && (node as Sprite).texture) {
        const renderObject = node.renderObject as SpriteObject;

        if (tfDirty || dirty & DirtyType.size) {
          renderObject.packVertex(this.posBuffer);
          this.posBuffer.loaded = false;
        }
        if (colorDirty) {
          renderObject.packColor(this.colorBuffer);
          this.colorBuffer.loaded = false;
        }
        if (dirty & DirtyType.texture) {
          renderObject.packUV(this.uvBuffer);
          this.uvBuffer.loaded = false;
        }
      }

      node.pp.dirty = 0;
      // console.log(node.label, "---clear--- update dirty1");
    }
  }

  private _collect(node: Node, worldMatrix: Matrix, worldAlpha: number) {
    const { pp, children } = node;
    const { visible, alpha, dirty, transform, localMatrix, pos } = pp;
    if (!visible || alpha < 0.001) return;

    // 更新 worldMatrix
    if (dirty & DirtyType.transform) {
      transform.updateMatrix(localMatrix, pp.worldMatrix, pos, worldMatrix);
    }

    // 更新 worldAlpha
    if (dirty & DirtyType.color) {
      if (pp.color === Color.Default) pp.color = new Color();
      pp.color.changeAlpha(alpha * worldAlpha);
    }

    this.nodes.push(node);
    if ("texture" in node && node.texture) {
      this._add(node as unknown as IRenderable);
    }

    const count = children.length;
    if (count) {
      let i = 0;
      while (i < count) {
        this._collectChild(children[i], pp.worldMatrix, pp.color.alpha);
        i++;
      }
    }
  }

  private _add(node: IRenderable) {
    this.spriteCount++;
    const renderObject = node.renderObject;

    renderObject.vertexStart = this.vertexSize;
    renderObject.colorStart = this.colorSize;
    renderObject.uvStart = this.uvSize;
    renderObject.indexStart = this.indexSize;

    this.vertexSize += renderObject.vertexSize;
    this.colorSize += renderObject.colorSize;
    this.uvSize += renderObject.uvSize;
    this.indexSize += renderObject.indexSize;
  }

  private _collectChild(node: Node, worldMatrix: Matrix, worldAlpha: number) {
    const { filters } = node.pp;
    if (filters.length) {
      // 把滤镜转换为普通的图片 TODO: 会不会很费内存，会破坏 render？
      const target = FilterManager.instance.render(node, filters);
      // 渲染滤镜后的图片
      this._collect(target, worldMatrix, worldAlpha);
    } else if (node.cache) {
      const batchGroup = getBatchGroupFromCache(node);
      batchGroup.collect(node, worldMatrix, this.camera);
      this.batches.push(batchGroup);
    } else {
      this._collect(node, worldMatrix, worldAlpha);
    }
  }

  private _fat() {
    // 扩充数据长度
    if (this.vertexSize > this.posBuffer.size) {
      // TODO 是否需要缩小
      this.posBuffer.fat(this.vertexSize);
    }
    if (this.colorSize > this.colorBuffer.size) {
      this.colorBuffer.fat(this.colorSize);
    }
    if (this.uvSize > this.uvBuffer.size) {
      this.uvBuffer.fat(this.uvSize);
    }
    if (this.indexSize > this.indexBuffer.size) {
      this.indexBuffer.fat(this.indexSize);
    }
  }

  private _batch() {
    // 创建 batch
    let batch = this._createBatch();
    const count = this.nodes.length;
    let indexCount = 0;
    for (let i = 0; i < count; i++) {
      const node = this.nodes[i] as IRenderable;
      // 这个地方判断，是否会消耗性能，还能优化吗
      if (!node.texture) {
        node.pp.dirty = 0;
        // console.log(node.label, "---clear--- collect dirty1");
        continue;
      }
      const renderObject = node.renderObject;

      let textureId = batch.add(node.texture);
      if (textureId === -1) {
        batch.size = indexCount - batch.startIndex;
        batch = this._createBatch();
        batch.startIndex = indexCount;
        textureId = batch.add(node.texture);
      }

      renderObject.batch = batch;
      renderObject.textureId = textureId;
      renderObject.packVertex(this.posBuffer);
      renderObject.packColor(this.colorBuffer);
      renderObject.packUV(this.uvBuffer);
      renderObject.packIndex(this.indexBuffer);

      indexCount += renderObject.indexSize;

      node.pp.dirty = 0;
      // console.log(node.label, "---clear--- collect dirty1");
    }

    batch.size = indexCount - batch.startIndex;
  }

  private _createBatch() {
    const batch = Batch.create(this);
    this.batches.push(batch);
    return batch;
  }

  private _uploadBuffer() {
    this.posBuffer.upload();
    this.colorBuffer.upload();
    this.uvBuffer.upload();
    this.indexBuffer.upload();
  }

  reset() {
    this.resetCount++;

    for (const batch of this.batches) {
      batch.reset();
    }
    this.batches.length = 0;

    this.posBuffer.reset();
    this.colorBuffer.reset();
    this.uvBuffer.reset();
    this.indexBuffer.reset();
    this.vertexSize = 0;
    this.colorSize = 0;
    this.uvSize = 0;
    this.indexSize = 0;

    this.nodes.length = 0;
    this.spriteCount = 0;
  }
}
