import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Timer } from "../../utils/timer";

describe("Timer", () => {
  let timer: Timer;

  beforeEach(() => {
    timer = new Timer();
  });

  afterEach(() => {
    timer.destroy();
  });

  describe("基本属性", () => {
    it("初始化时应该有正确的默认值", () => {
      expect(timer.delta).toBe(0);
      expect(timer.scale).toBe(1);
      expect(timer.currentTime).toBe(0);
      expect(timer.currentFrame).toBe(0);
      expect(timer.paused).toBe(false);
      expect(timer.count).toBe(0);
      expect(timer.destroyed).toBe(false);
    });

    it("系统级Timer实例应该存在", () => {
      expect(Timer.system).toBeInstanceOf(Timer);
    });
  });

  describe("暂停和恢复", () => {
    it("暂停后paused属性应为true", () => {
      timer.pause();
      expect(timer.paused).toBe(true);
    });

    it("恢复后paused属性应为false", () => {
      timer.pause();
      timer.resume();
      expect(timer.paused).toBe(false);
    });

    it("暂停时update不应更新时间", () => {
      timer.pause();
      timer.update(1);
      expect(timer.currentTime).toBe(0);
      expect(timer.currentFrame).toBe(0);
    });
  });

  describe("销毁", () => {
    it("销毁后destroyed属性应为true", () => {
      timer.destroy();
      expect(timer.destroyed).toBe(true);
    });

    it("销毁后应清除所有计时器", () => {
      const callback = vi.fn();
      timer.once(0.1, callback);
      expect(timer.count).toBe(1);

      timer.destroy();
      expect(timer.count).toBe(0);
    });

    it("销毁后不应添加新的计时器", () => {
      timer.destroy();
      const callback = vi.fn();
      timer.once(0.1, callback);
      expect(timer.count).toBe(0);
    });
  });

  describe("计时器操作", () => {
    it("once应添加一个一次性计时器", () => {
      const callback = vi.fn();
      timer.once(0.1, callback);
      expect(timer.count).toBe(1);
    });

    it("loop应添加一个循环计时器", () => {
      const callback = vi.fn();
      timer.loop(0.1, callback);
      expect(timer.count).toBe(1);
    });

    it("frameOnce应添加一个基于帧的一次性计时器", () => {
      const callback = vi.fn();
      timer.frameOnce(1, callback);
      expect(timer.count).toBe(1);
    });

    it("frameLoop应添加一个基于帧的循环计时器", () => {
      const callback = vi.fn();
      timer.frameLoop(1, callback);
      expect(timer.count).toBe(1);
    });

    it("clear应清除指定的计时器", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      timer.once(0.1, callback1);
      timer.once(0.2, callback2);
      expect(timer.count).toBe(2);

      timer.clear(callback1);
      expect(timer.count).toBe(1);
    });

    it("clearAll应清除所有计时器", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      timer.once(0.1, callback1);
      timer.once(0.2, callback2);
      expect(timer.count).toBe(2);

      timer.clearAll();
      expect(timer.count).toBe(0);
    });

    it("clearAll(caller)应只清除指定caller的计时器", () => {
      const caller1 = {};
      const caller2 = {};
      const callback = vi.fn();

      timer.once(0.1, callback, caller1);
      timer.once(0.2, callback, caller2);
      expect(timer.count).toBe(2);

      timer.clearAll(caller1);
      expect(timer.count).toBe(1);
    });
  });

  describe("计时器执行", () => {
    it("once计时器应只执行一次", () => {
      const callback = vi.fn();
      timer.once(0.1, callback);

      timer.update(0.05);
      expect(callback).not.toHaveBeenCalled();

      timer.update(0.15);
      expect(callback).toHaveBeenCalledTimes(1);

      timer.update(0.25);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("loop计时器应循环执行", () => {
      const callback = vi.fn();
      timer.loop(0.1, callback);

      timer.update(0.05);
      expect(callback).not.toHaveBeenCalled();

      timer.update(0.15);
      expect(callback).toHaveBeenCalledTimes(1);

      timer.update(0.25);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("frameOnce计时器应在指定帧后执行一次", () => {
      const callback = vi.fn();
      timer.frameOnce(2, callback);

      timer.update(0.1); // 第1帧
      expect(callback).not.toHaveBeenCalled();

      timer.update(0.2); // 第2帧
      expect(callback).toHaveBeenCalledTimes(1);

      timer.update(0.3); // 第3帧
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("frameLoop计时器应在每隔指定帧数执行", () => {
      const callback = vi.fn();
      timer.frameLoop(2, callback);

      timer.update(0.1); // 第1帧
      expect(callback).not.toHaveBeenCalled();

      timer.update(0.2); // 第2帧
      expect(callback).toHaveBeenCalledTimes(1);

      timer.update(0.3); // 第3帧
      expect(callback).toHaveBeenCalledTimes(1);

      timer.update(0.4); // 第4帧
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it("计时器应传递参数给回调函数", () => {
      const callback = vi.fn();
      timer.once(0.1, callback, null, "arg1", "arg2");

      timer.update(0.15);
      expect(callback).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("时间缩放应影响计时器执行", () => {
      const callback = vi.fn();
      timer.scale = 2;
      timer.once(0.1, callback);

      timer.update(0.05); // 实际时间流逝0.1秒
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("静态方法", () => {
    it("callLater应添加延迟一帧执行的处理器", () => {
      const callback = vi.fn();
      const result = Timer.callLater(callback);

      expect(result).toBe(true);
      expect(Timer.callLaterList.length).toBe(1);
    });

    it("重复调用callLater应返回false", () => {
      const callback = vi.fn();
      Timer.callLater(callback);
      const result = Timer.callLater(callback);

      expect(result).toBe(false);
      expect(Timer.callLaterList.length).toBe(1);
    });

    afterEach(() => {
      // 清理callLaterList
      Timer.callLaterList.length = 0;
    });
  });
});
