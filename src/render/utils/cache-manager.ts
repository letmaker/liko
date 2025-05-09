import { EventType } from '../../const';
import type { LikoNode } from '../../nodes/node';
import { BatchGroup } from '../batch/batch-group';

const groups: Map<LikoNode, BatchGroup> = new Map();
export function getBatchGroupFromCache(node: LikoNode): BatchGroup {
  let batchGroup = groups.get(node);
  if (!batchGroup) {
    batchGroup = new BatchGroup();
    node.on(EventType.destroyed, () => batchGroup?.reset());
    groups.set(node, batchGroup);
  }
  return batchGroup;
}

const pipelines: Map<string, GPURenderPipeline> = new Map();
export function getPipelineFromCache(shader: string, builder: () => GPURenderPipeline): GPURenderPipeline {
  let pipeline = pipelines.get(shader);
  if (!pipeline) {
    pipeline = builder();
    pipelines.set(shader, pipeline);
  }
  return pipeline;
}
