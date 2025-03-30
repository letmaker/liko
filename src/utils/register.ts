import type { ILoader } from "../loader/loader-manager";
import type { Node } from "../nodes/node";
import type { Filter } from "../render/filter/filter";
import { Ease } from "../scripts/effect/ease";
import type { ScriptBase } from "../scripts/script-base";

/**
 * 注册器
 */
export class Register {
  /** 脚本映射 */
  static scriptMap: Record<string, typeof ScriptBase> = {};
  /** 节点映射 */
  static nodeMap: Record<string, typeof Node> = {};
  /** 滤镜映射 */
  static filterMap: Record<string, typeof Filter> = {};
  /** 缓动函数映射 */
  static easeMap: Record<string, (time: number) => number> = {};
  /** 加载器 */
  static loaders: Array<ILoader> = [];

  /**
   * 注册脚本
   * @param name 脚本名称
   * @param script 脚本类
   */
  static regScript(name: string, script: typeof ScriptBase): void {
    Register.scriptMap[name] = script;
  }
  /**
   * 根据名称获得脚本类
   * @param name 脚本名称
   * @returns 脚本类
   */
  static getScript(name: string): ScriptBase | undefined {
    const Class: any = Register.scriptMap[name];
    if (Class === undefined) {
      console.error(`can not create script: ${name}`);
      return undefined;
    }
    return new Class() as ScriptBase;
  }

  /**
   * 注册节点
   * @param name 节点名称
   * @param node 节点类
   */
  static regNode(name: string, node: typeof Node): void {
    Register.nodeMap[name] = node;
  }
  /**
   * 根据名称获得节点实例
   * @param name 节点名称
   * @returns 节点实例
   */
  static getNode(name: string): Node | undefined {
    const Class: any = Register.nodeMap[name];
    if (Class === undefined) {
      console.error(`can not create node: ${name}`);
      return undefined;
    }
    return new Class();
  }

  /**
   * 注册滤镜
   * @param name 滤镜名称
   * @param node 滤镜类
   */
  static regFilter(name: string, node: typeof Filter): void {
    Register.filterMap[name] = node;
  }
  /**
   * 根据名称获得滤镜实例
   * @param name 滤镜名称
   * @returns 滤镜实例
   */
  static getFilter(name: string): Filter | undefined {
    const Class: any = Register.filterMap[name];
    if (Class === undefined) {
      console.error(`can not create filter: ${name}`);
      return undefined;
    }
    return new Class();
  }

  /**
   * 注册缓动函数
   * @param name 缓动名称
   * @param ease 缓动函数
   */
  static regEase(name: string, ease: (time: number) => number): void {
    Register.easeMap[name] = ease;
  }
  /**
   * 根据名称返回缓动函数
   * @param name 缓动名称
   * @returns 缓动函数
   */
  static getEase(name: string): (time: number) => number {
    const ease = Register.easeMap[name] || (Ease as any)[name];
    if (ease === undefined) {
      console.error(`can not create ease: ${name}`);
      return Ease.Linear;
    }
    return ease;
  }

  /**
   * 注册加载器
   */
  static regLoader(loader: ILoader): void {
    Register.loaders.push(loader);
  }
}
