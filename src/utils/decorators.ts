import { regNode, regScript } from './register';

type Constructor = new (...args: any[]) => any;

/** 注册节点装饰器 */
export const RegNode = (className: string) => (target: Constructor) => {
  regNode(className, target);
  return target;
};

/** 注册脚本装饰器 */
export const RegScript = (className: string) => (target: Constructor) => {
  regScript(className, target);
  return target;
};
