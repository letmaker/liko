import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Ease } from "../../scripts/effect/ease";
import { Tween } from "../../scripts/effect/tween";
import { Timer } from "../../utils/timer";

// 模拟 Timer.system
vi.mock("../../utils/timer", () => ({
  Timer: {
    system: {
      frameLoop: vi.fn(),
      clear: vi.fn(),
      delta: 0.016, // 模拟 16ms 的帧时间
    },
  },
}));

describe("Tween", () => {
  let mockTarget: { x: number; y: number; alpha: number };

  beforeEach(() => {
    // 重置模拟
    vi.clearAllMocks();

    // 重置测试对象
    mockTarget = { x: 0, y: 0, alpha: 1 };

    // 清理所有动画
    Tween.clearAll();
  });

  afterEach(() => {
    // 确保每个测试后清理所有动画
    Tween.clearAll();
  });

  describe("静态方法", () => {
    it("to() 应该创建一个新的 Tween 实例并添加到列表中", () => {
      const tween = Tween.to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
      });

      expect(tween).toBeInstanceOf(Tween);
      expect(tween.isPlaying).toBe(false);
      expect(tween.destroyed).toBe(false);
    });

    it("from() 应该创建一个新的 Tween 实例并添加到列表中", () => {
      const tween = Tween.from({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
      });

      expect(tween).toBeInstanceOf(Tween);
      expect(tween.isPlaying).toBe(false);
      expect(tween.destroyed).toBe(false);
    });

    it("clear() 应该清理指定标签的动画", () => {
      const tween1 = Tween.to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
        label: "test1",
      });

      const tween2 = Tween.to({
        target: mockTarget,
        props: { y: 100 },
        duration: 1,
        label: "test2",
      });

      Tween.clear("test1");

      expect(tween1.destroyed).toBe(true);
      expect(tween2.destroyed).toBe(false);
    });

    it("clearAll() 应该清理所有动画", () => {
      const tween1 = Tween.to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
      });

      const tween2 = Tween.to({
        target: mockTarget,
        props: { y: 100 },
        duration: 1,
      });

      Tween.clearAll();

      expect(tween1.destroyed).toBe(true);
      expect(tween2.destroyed).toBe(true);
    });

    it("创建相同标签的动画应该自动清理之前的动画", () => {
      const tween1 = Tween.to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
        label: "test",
      });

      const tween2 = Tween.to({
        target: mockTarget,
        props: { y: 100 },
        duration: 1,
        label: "test",
      });

      expect(tween1.destroyed).toBe(true);
      expect(tween2.destroyed).toBe(false);
    });
  });

  describe("实例方法", () => {
    it("set() 应该立即设置目标对象的属性", () => {
      const tween = new Tween();
      tween.set(mockTarget, { x: 100, y: 200 });

      expect(mockTarget.x).toBe(100);
      expect(mockTarget.y).toBe(200);
    });

    it("to() 应该添加一个缓动效果到队列", () => {
      const tween = new Tween();
      const result = tween.to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
      });

      expect(result).toBe(tween); // 应该返回自身以支持链式调用
    });

    it("from() 应该添加一个缓动效果到队列", () => {
      const tween = new Tween();
      const result = tween.from({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
      });

      expect(result).toBe(tween); // 应该返回自身以支持链式调用
    });

    it("play() 应该开始播放缓动队列并返回 Promise", async () => {
      const tween = new Tween().to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
      });

      const promise = tween.play();
      expect(promise).toBeInstanceOf(Promise);
      expect(tween.isPlaying).toBe(true);
      expect(Timer.system.onFrame).toHaveBeenCalled();

      // 模拟动画完成
      // @ts-ignore - 使用私有方法进行测试
      tween._update(1);

      await promise;
    });

    it("pause() 应该暂停缓动队列", () => {
      const tween = new Tween().to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
      });

      tween.play();
      tween.pause();

      expect(tween.paused).toBe(true);
      expect(Timer.system.clearTimer).toHaveBeenCalled();
    });

    it("resume() 应该恢复已暂停的缓动队列", () => {
      const tween = new Tween().to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
      });

      tween.play();
      tween.pause();
      tween.resume();

      expect(tween.paused).toBe(false);
      expect(Timer.system.onFrame).toHaveBeenCalledTimes(2);
    });

    it("stop() 应该停止缓动队列", () => {
      const tween = new Tween().to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
      });

      tween.play();
      tween.stop();

      expect(tween.isPlaying).toBe(false);
      expect(Timer.system.clearTimer).toHaveBeenCalled();
    });

    it("destroy() 应该销毁整个缓动队列", () => {
      const tween = new Tween().to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
      });

      tween.play();
      tween.destroy();

      expect(tween.destroyed).toBe(true);
      expect(tween.isPlaying).toBe(false);
      expect(Timer.system.clearTimer).toHaveBeenCalled();
    });

    it("onAllComplete() 应该设置整个缓动队列结束时的回调", async () => {
      const callback = vi.fn();
      const tween = new Tween()
        .to({
          target: mockTarget,
          props: { x: 100 },
          duration: 1,
        })
        .onAllComplete(callback);

      const promise = tween.play();

      // 模拟动画完成
      // @ts-ignore - 使用私有方法进行测试
      tween._update(1);

      await promise;
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("动画效果", () => {
    it("应该正确更新目标对象的属性", () => {
      const tween = new Tween().to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
        ease: Ease.Linear,
      });

      tween.play();

      // 模拟动画进行到一半
      // @ts-ignore - 使用私有方法进行测试
      tween._update(0.5);

      expect(mockTarget.x).toBeCloseTo(50, 0);

      // 模拟动画完成
      // @ts-ignore - 使用私有方法进行测试
      tween._update(0.5);

      expect(mockTarget.x).toBeCloseTo(100, 0);
    });

    it("应该支持多个属性同时缓动", () => {
      const tween = new Tween().to({
        target: mockTarget,
        props: { x: 100, y: 200 },
        duration: 1,
      });

      tween.play();

      // 模拟动画进行到一半
      // @ts-ignore - 使用私有方法进行测试
      tween._update(0.5);

      expect(mockTarget.x).toBeCloseTo(50, 0);
      expect(mockTarget.y).toBeCloseTo(100, 0);
    });

    it("应该支持延迟开始", () => {
      const tween = new Tween().to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
        delay: 0.5,
      });

      tween.play();

      // 模拟延迟时间内的更新
      // @ts-ignore - 使用私有方法进行测试
      tween._update(0.3);

      expect(mockTarget.x).toBeCloseTo(0, 0); // 延迟期间不应该有变化

      // 模拟延迟结束后的更新
      // @ts-ignore - 使用私有方法进行测试
      tween._update(0.3);

      expect(mockTarget.x).toBeCloseTo(10, 0); // 延迟结束后开始变化
    });

    it("应该支持重复播放", () => {
      const tween = new Tween().to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
        repeat: 2,
      });

      tween.play();

      // 第一次完成
      // @ts-ignore - 使用私有方法进行测试
      tween._update(1);

      expect(mockTarget.x).toBeCloseTo(100, 0);

      // 重置为初始值
      mockTarget.x = 0;

      // 第二次完成
      // @ts-ignore - 使用私有方法进行测试
      tween._update(1);

      expect(mockTarget.x).toBeCloseTo(100, 0);
    });

    it("应该支持往返动画效果", () => {
      const tween = new Tween().to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
        repeat: 2,
        yoyo: true,
      });

      tween.play();

      // 第一次完成
      // @ts-ignore - 使用私有方法进行测试
      tween._update(1);

      expect(mockTarget.x).toBeCloseTo(100, 0);

      // 第二次完成（往返）
      // @ts-ignore - 使用私有方法进行测试
      tween._update(1);

      expect(mockTarget.x).toBeCloseTo(0, 0); // 应该回到初始值
    });

    it("应该正确调用回调函数", () => {
      const onAwake = vi.fn();
      const onStart = vi.fn();
      const onUpdate = vi.fn();
      const onEnd = vi.fn();
      const onComplete = vi.fn();

      const tween = new Tween().to({
        target: mockTarget,
        props: { x: 100 },
        duration: 1,
        onAwake,
        onStart,
        onUpdate,
        onEnd,
        onComplete,
      });

      tween.play();

      // 模拟动画更新
      // @ts-ignore - 使用私有方法进行测试
      tween._update(0.5);

      expect(onUpdate).toHaveBeenCalled();

      // 模拟动画完成
      // @ts-ignore - 使用私有方法进行测试
      tween._update(0.5);

      expect(onEnd).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
