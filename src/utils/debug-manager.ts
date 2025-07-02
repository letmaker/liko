import type { LikoNode } from '../nodes/node';
import type { Stage } from '../nodes/stage';

// 扩展 Window 类型以包含likoDebug属性
declare global {
  interface Window {
    likoDebug?: DebugManager;
  }
}

/**
 * Debug 统计信息接口
 */
interface DebugStats {
  /** 节点数量 */
  nodeCount: number;
  /** 物理刚体数量 */
  rigidBodyCount: number;
  /** FPS */
  fps: number;
}

/**
 * Debug 管理器，用于开发环境下的性能监控和调试信息显示
 *
 * 特性：
 * - 通过 URL 参数 ?debug=true 启用 debug 模式
 * - 在非 debug 模式下完全不执行任何统计逻辑，保证零性能消耗
 * - 实时显示节点统计信息
 * - 支持自定义更新频率
 * - 使用迭代而非递归避免调用栈过深
 * - 最小化DOM操作提升渲染性能
 */
export class DebugManager {
  private static _instance: DebugManager | null = null;
  private _isDebugMode = false;
  private _debugPanel: HTMLElement | null = null;
  private _stage: Stage | null = null;
  private _updateTimer = 0;
  private _updateInterval = 2000; // 更新频率（毫秒）
  private _frameCount = 0;
  private _lastFpsTime = 0;
  private _currentFps = 0;
  private _fpsAnimationId = 0;

  // 性能优化：DOM元素缓存
  private _nodeCountElement: HTMLElement | null = null;
  private _rigidBodyCountElement: HTMLElement | null = null;
  private _fpsElement: HTMLElement | null = null;
  private _rigidBodyDiv: HTMLElement | null = null;

  private constructor() {
    this._checkDebugMode();
    // 优化：只在debug模式下初始化FPS计数器
    if (this._isDebugMode) {
      this._initFpsCounter();
    }
  }

  /**
   * 获取 Debug 管理器单例实例
   */
  static getInstance(): DebugManager {
    if (!DebugManager._instance) {
      DebugManager._instance = new DebugManager();
    }
    return DebugManager._instance;
  }

  /**
   * 检测是否启用 debug 模式
   */
  private _checkDebugMode(): void {
    const urlParams = new URLSearchParams(window.location.search);
    this._isDebugMode = urlParams.get('debug') === 'true';
  }

  /**
   * 是否处于 debug 模式
   */
  get isDebugMode(): boolean {
    return this._isDebugMode;
  }

  /**
   * 初始化 debug 系统
   * @param stage 舞台实例
   */
  init(stage: Stage): void {
    if (!this._isDebugMode) return; // 非 debug 模式下直接返回，零性能消耗

    this._stage = stage;
    this._createDebugPanel();
    this._startStatsUpdate();
  }

  /**
   * 创建 debug 信息面板（优化DOM结构）
   */
  private _createDebugPanel(): void {
    this._debugPanel = document.createElement('div');
    this._debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      min-width: 120px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;

    // 优化：预创建DOM元素，避免频繁innerHTML操作
    const nodeCountDiv = document.createElement('div');
    nodeCountDiv.innerHTML = '节点数量: ';
    this._nodeCountElement = document.createElement('span');
    this._nodeCountElement.style.color = '#00ffff';
    nodeCountDiv.appendChild(this._nodeCountElement);

    this._rigidBodyDiv = document.createElement('div');
    this._rigidBodyDiv.innerHTML = '刚体数量: ';
    this._rigidBodyCountElement = document.createElement('span');
    this._rigidBodyCountElement.style.color = '#ff9900';
    this._rigidBodyDiv.appendChild(this._rigidBodyCountElement);
    this._rigidBodyDiv.style.display = 'none'; // 默认隐藏

    const fpsDiv = document.createElement('div');
    fpsDiv.innerHTML = 'FPS: ';
    this._fpsElement = document.createElement('span');
    fpsDiv.appendChild(this._fpsElement);

    this._debugPanel.appendChild(nodeCountDiv);
    this._debugPanel.appendChild(this._rigidBodyDiv);
    this._debugPanel.appendChild(fpsDiv);

    document.body.appendChild(this._debugPanel);
  }

  /**
   * 初始化FPS计数器（优化清理机制）
   */
  private _initFpsCounter(): void {
    if (!this._isDebugMode) return;

    this._lastFpsTime = performance.now();
    this._frameCount = 0;

    const updateFps = () => {
      this._frameCount++;
      const currentTime = performance.now();
      const deltaTime = currentTime - this._lastFpsTime;

      if (deltaTime >= 1000) {
        this._currentFps = Math.round((this._frameCount * 1000) / deltaTime);
        this._frameCount = 0;
        this._lastFpsTime = currentTime;
      }

      if (this._isDebugMode) {
        this._fpsAnimationId = requestAnimationFrame(updateFps);
      }
    };

    this._fpsAnimationId = requestAnimationFrame(updateFps);
  }

  /**
   * 收集统计信息
   */
  private _collectStats(): DebugStats {
    const nodeCount = this._countNodes(this._stage!);
    const rigidBodyCount = this._getRigidBodyCount();

    return {
      nodeCount,
      rigidBodyCount,
      fps: this._currentFps,
    };
  }

  /**
   * 优化的节点统计方法（使用迭代代替递归）
   */
  private _countNodes(rootNode: LikoNode): number {
    let count = 0;
    const stack: LikoNode[] = [rootNode];

    // 优化：使用迭代避免递归调用栈过深
    while (stack.length > 0) {
      const node = stack.pop()!;
      count++;

      // 将子节点按逆序添加到栈中，保持遍历顺序一致
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }
    }

    return count;
  }

  /**
   * 优化的物理刚体数量获取方法
   */
  private _getRigidBodyCount(): number {
    if (typeof window === 'undefined') {
      return 0;
    }

    const physics = window.physics;
    if (!physics?.world) {
      return 0;
    }

    return physics.world.getBodyCount();
  }

  /**
   * 开始统计信息更新
   */
  private _startStatsUpdate(): void {
    if (!this._isDebugMode) return;

    const update = () => {
      if (this._stage && this._debugPanel) {
        const stats = this._collectStats();
        this._updateDebugPanel(stats);
      }
      this._updateTimer = window.setTimeout(update, this._updateInterval);
    };

    update();
  }

  /**
   * 优化的 debug 面板更新方法（最小化DOM操作）
   */
  private _updateDebugPanel(stats: DebugStats): void {
    if (!this._nodeCountElement || !this._rigidBodyCountElement || !this._fpsElement || !this._rigidBodyDiv) return;

    // 优化：只更新文本内容，避免innerHTML操作
    this._nodeCountElement.textContent = stats.nodeCount.toString();

    if (stats.rigidBodyCount > 0) {
      this._rigidBodyCountElement.textContent = stats.rigidBodyCount.toString();
      this._rigidBodyDiv.style.display = '';
    } else {
      this._rigidBodyDiv.style.display = 'none';
    }

    // 优化：只在FPS值改变时更新颜色和文本
    const currentFpsText = stats.fps.toString();
    if (this._fpsElement.textContent !== currentFpsText) {
      const fpsColor = stats.fps > 55 ? '#00ff00' : stats.fps > 30 ? '#ffaa00' : '#ff0000';
      this._fpsElement.style.color = fpsColor;
      this._fpsElement.textContent = currentFpsText;
    }
  }

  /**
   * 销毁 debug 系统（优化清理机制）
   */
  destroy(): void {
    if (!this._isDebugMode) return;

    // 优化：确保所有计时器和动画帧都被清理
    if (this._updateTimer) {
      clearTimeout(this._updateTimer);
      this._updateTimer = 0;
    }

    if (this._fpsAnimationId) {
      cancelAnimationFrame(this._fpsAnimationId);
      this._fpsAnimationId = 0;
    }

    if (this._debugPanel?.parentNode) {
      this._debugPanel.parentNode.removeChild(this._debugPanel);
      this._debugPanel = null;
    }

    // 清理DOM元素引用
    this._nodeCountElement = null;
    this._rigidBodyCountElement = null;
    this._fpsElement = null;
    this._rigidBodyDiv = null;

    this._stage = null;
  }
}

// 导出便捷的全局实例
export const debugManager = DebugManager.getInstance();

// 向全局暴露 debug 管理器（仅在 debug 模式下）
if (debugManager.isDebugMode && typeof window !== 'undefined') {
  window.likoDebug = debugManager;
}
