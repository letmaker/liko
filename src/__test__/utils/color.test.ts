import { describe, it, expect } from "vitest";
import { Color, type ColorData } from "../../utils/color";

describe("Color 类测试", () => {
  describe("构造函数和默认值", () => {
    it("应该创建默认白色", () => {
      const color = new Color();
      expect(color.red).toBe(1);
      expect(color.green).toBe(1);
      expect(color.blue).toBe(1);
      expect(color.alpha).toBe(1);
      expect(color.toString()).toBe("rgba(255,255,255,1)");
    });

    it("应该有一个静态默认白色实例", () => {
      expect(Color.Default.red).toBe(1);
      expect(Color.Default.green).toBe(1);
      expect(Color.Default.blue).toBe(1);
      expect(Color.Default.alpha).toBe(1);
      expect(Color.Default.toString()).toBe("rgba(255,255,255,1)");
    });
  });

  describe("颜色值解析", () => {
    it("应该正确解析数字格式的颜色值", () => {
      const testCases: [number, [number, number, number, number]][] = [
        [0xff0000, [1, 0, 0, 1]], // 红色
        [0x00ff00, [0, 1, 0, 1]], // 绿色
        [0x0000ff, [0, 0, 1, 1]], // 蓝色
        [0xffff00, [1, 1, 0, 1]], // 黄色
        [0x000000, [0, 0, 0, 1]], // 黑色
        [0xffffff, [1, 1, 1, 1]], // 白色
      ];

      for (const [input, [r, g, b, a]] of testCases) {
        const color = new Color(input);
        expect(color.red).toBeCloseTo(r, 5);
        expect(color.green).toBeCloseTo(g, 5);
        expect(color.blue).toBeCloseTo(b, 5);
        expect(color.alpha).toBeCloseTo(a, 5);
      }
    });

    it("应该正确解析十六进制格式的颜色值", () => {
      const testCases: [ColorData, [number, number, number, number]][] = [
        ["#ff0000", [1, 0, 0, 1]], // 红色
        ["#00ff00", [0, 1, 0, 1]], // 绿色
        ["#0000ff", [0, 0, 1, 1]], // 蓝色
        ["0xff0000", [1, 0, 0, 1]], // 红色 (0x格式)
        ["0x00ff00", [0, 1, 0, 1]], // 绿色 (0x格式)
        ["0x0000ff", [0, 0, 1, 1]], // 蓝色 (0x格式)
      ];

      for (const [input, [r, g, b, a]] of testCases) {
        const color = new Color(input);
        expect(color.red).toBeCloseTo(r, 5);
        expect(color.green).toBeCloseTo(g, 5);
        expect(color.blue).toBeCloseTo(b, 5);
        expect(color.alpha).toBeCloseTo(a, 5);
      }
    });

    it("应该正确解析 RGB 格式的颜色值", () => {
      const testCases: [ColorData, [number, number, number, number]][] = [
        ["rgb(255, 0, 0)", [1, 0, 0, 1]], // 红色
        ["rgb(0, 255, 0)", [0, 1, 0, 1]], // 绿色
        ["rgb(0, 0, 255)", [0, 0, 1, 1]], // 蓝色
        ["rgb(255,0,0)", [1, 0, 0, 1]], // 无空格
        ["rgb(128, 128, 128)", [0.5019607843137255, 0.5019607843137255, 0.5019607843137255, 1]], // 灰色
      ];

      for (const [input, [r, g, b, a]] of testCases) {
        const color = new Color(input);
        expect(color.red).toBeCloseTo(r, 5);
        expect(color.green).toBeCloseTo(g, 5);
        expect(color.blue).toBeCloseTo(b, 5);
        expect(color.alpha).toBeCloseTo(a, 5);
      }
    });

    it("应该正确解析 RGBA 格式的颜色值", () => {
      const testCases: [ColorData, [number, number, number, number]][] = [
        ["rgba(255, 0, 0, 1)", [1, 0, 0, 1]], // 红色，不透明
        ["rgba(0, 255, 0, 0.5)", [0, 1, 0, 0.5]], // 绿色，半透明
        ["rgba(0, 0, 255, 0)", [0, 0, 1, 0]], // 蓝色，全透明
        ["rgba(255,0,0,0.75)", [1, 0, 0, 0.75]], // 无空格
      ];

      for (const [input, [r, g, b, a]] of testCases) {
        const color = new Color(input);
        expect(color.red).toBeCloseTo(r, 5);
        expect(color.green).toBeCloseTo(g, 5);
        expect(color.blue).toBeCloseTo(b, 5);
        expect(color.alpha).toBeCloseTo(a, 5);
      }
    });
  });

  describe("颜色值获取", () => {
    it("应该正确获取 RGBA 分量", () => {
      const color = new Color(0x7f3f1f);
      expect(color.red).toBeCloseTo(127 / 255, 5);
      expect(color.green).toBeCloseTo(63 / 255, 5);
      expect(color.blue).toBeCloseTo(31 / 255, 5);
      expect(color.alpha).toBe(1);
    });

    it("应该正确获取原始颜色值", () => {
      const originalValue: ColorData = "rgba(100, 150, 200, 0.5)";
      const color = new Color(originalValue);
      expect(color.value).toBe(originalValue);
    });

    it("应该正确转换为字符串", () => {
      const color = new Color(0x7f3f1f);
      expect(color.toString()).toBe("rgba(127,63,31,1)");

      const colorWithAlpha = new Color("rgba(100, 150, 200, 0.5)");
      expect(colorWithAlpha.toString()).toBe("rgba(100,150,200,0.5)");
    });
  });

  describe("颜色值修改", () => {
    it("应该正确设置新的颜色值", () => {
      const color = new Color(0xff0000);
      expect(color.red).toBe(1);
      expect(color.green).toBe(0);
      expect(color.blue).toBe(0);

      color.value = 0x00ff00;
      expect(color.red).toBe(0);
      expect(color.green).toBe(1);
      expect(color.blue).toBe(0);

      color.value = "#0000ff";
      expect(color.red).toBe(0);
      expect(color.green).toBe(0);
      expect(color.blue).toBe(1);
    });

    it("应该正确修改透明度", () => {
      const color = new Color(0xff0000);
      expect(color.alpha).toBe(1);

      color.changeAlpha(0.5);
      expect(color.alpha).toBe(0.5);
      expect(color.red).toBe(1);
      expect(color.green).toBe(0);
      expect(color.blue).toBe(0);
      expect(color.toString()).toBe("rgba(255,0,0,0.5)");

      color.changeAlpha(0);
      expect(color.alpha).toBe(0);
      expect(color.toString()).toBe("rgba(255,0,0,0)");
    });
  });

  describe("ARGB 值测试", () => {
    it("应该正确计算 ARGB 整数值", () => {
      const testCases: [ColorData, number][] = [
        [0xff0000, 0xff_ff_00_00], // 红色，不透明
        [0x00ff00, 0xff_00_ff_00], // 绿色，不透明
        [0x0000ff, 0xff_00_00_ff], // 蓝色，不透明
        ["rgba(255, 0, 0, 0.5)", 0x7f_ff_00_00], // 红色，半透明
      ];

      for (const [input, expected] of testCases) {
        const color = new Color(input);
        expect(color.argb >>> 0).toBe(expected);
      }
    });

    it("应该在修改透明度后更新 ARGB 值", () => {
      const color = new Color(0xff0000);
      expect(color.argb >>> 0).toBe(0xff_ff_00_00);

      color.changeAlpha(0.5);
      expect(color.argb >>> 0).toBe(0x7f_ff_00_00);

      color.changeAlpha(0);
      expect(color.argb >>> 0).toBe(0x00_ff_00_00);
    });
  });
});
