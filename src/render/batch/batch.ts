import type { Texture } from '../../resource/texture';
import type { BatchGroup } from './batch-group';
import { TextureGroup } from './texture-group';

export class Batch {
  private static readonly _pool: Batch[] = [];

  textureGroup: TextureGroup = new TextureGroup();
  pipeline = 'batch';
  used = true;
  startIndex = 0;
  size = 0;

  constructor(public batchGroup: BatchGroup) {}

  static create(batchGroup: BatchGroup) {
    const pool = Batch._pool;
    for (let i = 0, count = pool.length; i < count; i++) {
      const batch = pool[i];
      if (!batch.used) {
        batch.used = true;
        batch.batchGroup = batchGroup;
        return batch;
      }
    }
    // console.log("create");
    const batch = new Batch(batchGroup);
    pool.push(batch);
    return batch;
  }

  add(texture: Texture): number {
    return this.textureGroup.add(texture.buffer);
  }

  getTextureId(texture: Texture): number | undefined {
    return this.textureGroup.getTextureId(texture);
  }

  reset() {
    this.used = false;
    this.startIndex = 0;
    this.size = 0;
    this.textureGroup.reset();
  }
}
