import type { Node } from "../nodes/node";
import type { IScriptData } from "../nodes/node";
import { RegScript } from "../utils/decorators";
import { Store } from "../utils/store";
import { createScript, getValue } from "../utils/utils";
import { Script } from "./script";
import type { ScriptBlock } from "./scriptBlock";
import type { IValueData, ISignal } from "./scriptBlock";

/**
 * 蓝图，图块的根容器
 */
@RegScript("Blueprint")
export class Blueprint extends Script {
  /** 蓝图数值 */
  readonly store = new Store();
  /** 蓝图块 */
  readonly blocks: Record<string, ScriptBlock> = {};
  /** 输入映射 */
  readonly inputs: { [signal: string]: Array<ISignal> } = {};
  /** 输出映射 */
  readonly outputs: { [signal: string]: Array<ISignal> } = {};

  get target(): Node {
    return super.target;
  }
  set target(value: Node) {
    super.target = value;
    const values = Object.values(this.blocks);
    for (const block of values) {
      block.target = value;
    }
  }

  destroy(): void {
    if (!this.destroyed) {
      const values = Object.values(this.blocks);
      for (const block of values) {
        block.destroy();
      }
      this.store.destroy();
      super.destroy();
    }
  }

  setProp(key: string, value: any): void {
    if (key === "blocks") {
      const blocks = value as Array<IScriptData>;
      for (const data of blocks) {
        this.addBlock(createScript(data) as ScriptBlock);
      }
    } else if (key === "store") {
      this.store.fromJson(value);
    } else {
      super.setProp(key, value);
    }
  }

  onAwake(): void {
    const values = Object.values(this.blocks);
    for (const block of values) {
      block.awake();
    }
    // 蓝图激活默认派发 $start$ 信号
    this.onSignal("$start$");
  }

  onSignal(signal: string): void {
    if (this.inputs?.[signal]) {
      this._emitSignal(signal, true);
      return;
    }
    if (this.outputs?.[signal]) {
      this._emitSignal(signal);
      return;
    }
  }

  /**
   * 发射信号，执行后续图块
   * @param signal 蓝图信号
   */
  private _emitSignal(signal: string, isInput = false): void {
    if (this.enabled) {
      const targets = isInput ? this.inputs[signal] : this.outputs[signal];
      if (targets) {
        for (const target of targets) {
          this.emit(target.id, target.signal, this, target.params);
        }
      }
    }
  }

  onUpdate(time: number): void {
    const values = Object.values(this.blocks);
    for (const block of values) {
      block.onUpdate(time);
    }
  }

  /**
   * 发射蓝图信号
   * @param targetId 目标对象ID
   * @param signal 蓝图信号
   * @param script 发射方图块
   * @param params 参数，所有参数均会默认被设置到蓝图的store内
   */
  emit(
    targetId: string,
    signal: string,
    script: ScriptBlock | Blueprint,
    params?: Record<string, IValueData | number | string | boolean>,
  ): void {
    if (params) {
      const keys = Object.keys(params);
      for (const key of keys) {
        const value = getValue(params[key], script);
        this.store.set(key, value);
      }
    }
    this.blocks[targetId]?.onSignal?.(signal);
  }

  /**
   * 添加图块
   * @param block 图块
   */
  addBlock(block: ScriptBlock): ScriptBlock {
    block.blueprint = this;
    block.target = this.target;
    this.blocks[block.id] = block;
    return block;
  }
}
