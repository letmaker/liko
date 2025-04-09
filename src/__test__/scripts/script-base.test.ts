import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ScriptBase } from "../../scripts/script-base";
import type { Node } from "../../nodes/node";
import type { Stage } from "../../nodes/stage";
import type { IScene } from "../../nodes/scene";
import { EventType } from "../../const";

// 创建一个具体的 ScriptBase 子类用于测试
class TestScript extends ScriptBase {
  testValue = 0;

  onCreateCalled = false;
  onAwakeCalled = false;
  onUpdateCalled = false;
  onDestroyCalled = false;
  onEnableCalled = false;
  onDisableCalled = false;

  lastDelta = 0;

  onCreate(): void {
    this.onCreateCalled = true;
  }

  onAwake(): void {
    this.onAwakeCalled = true;
  }

  onUpdate(delta: number): void {
    this.onUpdateCalled = true;
    this.lastDelta = delta;
  }

  onDestroy(): void {
    this.onDestroyCalled = true;
  }

  onEnable(): void {
    this.onEnableCalled = true;
  }

  onDisable(): void {
    this.onDisableCalled = true;
  }
}

describe("ScriptBase", () => {
  let script: TestScript;
  let node: Node;
  let mockStage: Stage;
  let mockScene: IScene;

  beforeEach(() => {
    // 创建模拟对象
    mockStage = {
      timer: {
        clearAll: vi.fn(),
      },
      offAll: vi.fn(),
    } as unknown as Stage;

    mockScene = {
      offAll: vi.fn(),
    } as unknown as IScene;

    node = {
      stage: mockStage,
      scene: mockScene,
      offAll: vi.fn(),
    } as unknown as Node;

    script = new TestScript();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("应该正确初始化默认属性", () => {
    expect(script.id).toBe("");
    expect(script.label).toBe("");
    expect(script.awaked).toBe(false);
    expect(script.destroyed).toBe(false);
    expect(script.enabled).toBe(true);
  });

  it("设置 target 时应该调用 onCreate", () => {
    expect(script.onCreateCalled).toBe(false);
    script.target = node;
    expect(script.onCreateCalled).toBe(true);
    expect(script.target).toBe(node);
  });

  it("应该正确获取 stage 和 scene", () => {
    script.target = node;
    expect(script.stage).toBe(mockStage);
    expect(script.scene).toBe(mockScene);
  });

  it("首次调用 update 时应该调用 onAwake 和 onUpdate", () => {
    script.target = node;
    expect(script.awaked).toBe(false);
    expect(script.onAwakeCalled).toBe(false);
    expect(script.onUpdateCalled).toBe(false);

    script.update(0.16);

    expect(script.awaked).toBe(true);
    expect(script.onAwakeCalled).toBe(true);
    expect(script.onUpdateCalled).toBe(true);
    expect(script.lastDelta).toBe(0.16);
  });

  it("禁用脚本时不应该调用 onUpdate", () => {
    script.target = node;
    script.enabled = false;
    expect(script.onDisableCalled).toBe(true);

    script.onUpdateCalled = false; // 重置标志
    script.update(0.16);

    expect(script.onUpdateCalled).toBe(false);
  });

  it("启用脚本时应该调用 onEnable", () => {
    script.target = node;
    script.enabled = false;
    expect(script.onDisableCalled).toBe(true);

    script.onEnableCalled = false; // 重置标志
    script.enabled = true;

    expect(script.onEnableCalled).toBe(true);
  });

  it("应该正确设置属性", () => {
    script.setProps({ testValue: 42, id: "test-id", label: "Test Script" });

    expect(script.testValue).toBe(42);
    expect(script.id).toBe("test-id");
    expect(script.label).toBe("Test Script");
  });

  it("销毁脚本时应该清除所有监听并调用 onDestroy", () => {
    script.target = node;
    script.destroy();

    expect(script.destroyed).toBe(true);
    expect(script.enabled).toBe(false);
    expect(node.offAll).toHaveBeenCalledWith(script);
    expect(mockScene.offAll).toHaveBeenCalledWith(script);
    expect(mockStage.offAll).toHaveBeenCalledWith(script);
    expect(mockStage.timer.clearAll).toHaveBeenCalledWith(script);
    expect(script.onDestroyCalled).toBe(true);
    expect(script.target).toBeUndefined();
  });

  it("销毁后的脚本不应该再次调用 onDestroy", () => {
    script.target = node;
    script.destroy();

    const offAllCallCount = (node.offAll as any).mock.calls.length;
    script.onDestroyCalled = false; // 重置标志

    script.destroy(); // 再次调用 destroy

    // 确保没有再次调用相关方法
    expect((node.offAll as any).mock.calls.length).toBe(offAllCallCount);
    expect(script.onDestroyCalled).toBe(false);
  });

  it("调用 signal 方法应该正确触发事件", () => {
    script.target = node;

    // 模拟 node.emit 方法
    const emitSpy = vi.fn();
    node.emit = emitSpy;

    // 调用 signal 方法
    script.signal("test", { data: 123, message: "abc" });

    // 验证 emit 方法被正确调用
    expect(emitSpy).toHaveBeenCalledWith(EventType.signal, "test", { data: 123, message: "abc" });

    // 测试没有 target 时不应该触发事件
    script.destroy(); // 清除 target
    emitSpy.mockClear();
    script.signal("test");
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
