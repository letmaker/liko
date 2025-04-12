import type { Physics } from "./physics";
export type { PhysicsOptions } from "./physics";

// 导出一个工厂函数，用于创建 Physics 实例
export async function createPhysics() {
  const { physics } = await import("./physics");
  window.physics = physics;
  return physics;
}

declare global {
  interface Window {
    physics: Physics;
  }
}
