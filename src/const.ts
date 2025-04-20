/** Math.PI * 2 */
export const PI2 = Math.PI * 2;
/** Math.PI / 2 */
export const PI_2 = Math.PI / 2;
/** 180 / Math.PI */
export const RAD_TO_DEG = 180 / Math.PI;
/** Math.PI / 180 */
export const DEG_TO_RAD = Math.PI / 180;

export enum DirtyType {
  /** pos,scale,rotation发生了变化 */
  transform = 1,
  /** width，height发生了变化 */
  size = 2,
  /** texture发生了变化 */
  texture = 4,
  /** alpha，tint发生了变化 */
  color = 8,
  /** 滤镜发生了变化 */
  filter = 16,
  /** 添加删除子节点 */
  child = 32,
  /** 子节点变化导致了父节点变化 */
  parent = 64,
}

/** 事件类型枚举 */
export enum EventType {
  /** 节点被添加到节点树后，由 node 派发 */
  added = "added",
  /** 节点被添加到舞台时，这时可以获取 stage，由 node 派发  */
  addToStage = "addToStage",
  /** 节点从节点树移除后，由 node 派发 */
  removed = "removed",
  /** 节点被销毁时，由 node 派发 */
  destroyed = "destroyed",

  /** 节点更改大小时，由 node 派发 */
  resize = "resize",
  /** 节点旋转、缩放、位移时，由 node 派发，由于 transform 派发比较频繁（任何pos,scale,rotation改变都会触发），使用的时候，注意性能 */
  transform = "transform",

  /** 鼠标按下时，由 node 派发 */
  pointerdown = "pointerdown",
  /** 鼠标抬起时，由 node 派发 */
  pointerup = "pointerup",
  /** 鼠标移动时，由 node 派发 */
  pointermove = "pointermove",
  /** 鼠标经过时，由 node 派发 */
  pointerover = "pointerover",
  /** 鼠标移出时，由 node 派发 */
  pointerout = "pointerout",
  /** 鼠标在 canvas 外面被抬起时，由 node 派发 */
  pointerupoutside = "pointerupoutside",
  /** 鼠标点击时，由 node 派发 */
  click = "click",
  /** 信号触发时，由 node 派发 */
  signal = "signal",

  /** 键盘被按下时，由 stage 派发 */
  keydown = "keydown",
  /** 键盘被抬起时，由 stage 派发 */
  keyup = "keyup",
  /** 发生滚轮事件时，由 stage 派发 */
  wheel = "wheel",

  /** 碰撞开始时，由 physics 派发 */
  collisionStart = "collisionStart",
  /** 碰撞结束时，由 physics 派发 */
  collisionEnd = "collisionEnd",

  /** 动画开始播放时，由动画类派发 */
  played = "played",
  /** 动画停止播放时，由动画类派发 */
  stopped = "stopped",
  /** 动画播放结束时，由动画类派发  */
  ended = "ended",
  /** 动画暂停，由动画类派发 */
  paused = "paused",
  /** 动画恢复，由动画类派发 */
  resumed = "resumed",

  /** 单个资源加载完毕时，由 sprite、animation 等需要加载的节点，及 loaderManager 派发 */
  loaded = "loaded",
  /** 资源加载进度，由 loaderManager 派发 */
  progress = "progress",
  /** 资源全部加载完成，由 loaderManager 派发 */
  complete = "complete",
  /** 资源加载失败时，由 loaderManager 派发 */
  error = "error",
}
