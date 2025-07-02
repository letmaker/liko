import { App, EventType, ParticleSystem } from './';

/**
 * 粒子系统使用示例
 */
async function test() {
  // 初始化应用程序，创建800x800的画布，背景色为深灰色
  const app = new App();
  await app.init({
    width: 800,
    height: 800,
    bgColor: '#333333', // 深灰色背景便于观察粒子效果
  });

  app.stage.on(EventType.click, () => {
    new ParticleSystem({
      parent: app.stage,
      position: { x: Math.random() * 800, y: Math.random() * 800 }, // 屏幕上方，模拟瀑布从高处落下
      autoPlay: true,
      config: {
        // 重力设置：影响粒子的加速度
        gravityX: 0, // 水平重力为0，粒子不会左右偏移
        gravityY: 150, // 垂直重力150，粒子会加速向下落

        // 发射角度设置
        angle: 270, // 270度表示向下发射（0度为右，90度为下，180度为左，270度为上）
        angleVariance: 15, // 角度随机变化范围±15度，增加自然感

        // 颜色设置：RGBA格式，值范围0-1
        startColor: { r: 0.3, g: 0.6, b: 1.0, a: 1.0 }, // 开始时的蓝色（模拟水）
        finishColor: { r: 1, g: 0.3, b: 0.8, a: 0.0 }, // 结束时的粉色并逐渐透明

        // 粒子大小设置
        startParticleSize: 8, // 粒子初始大小
        finishParticleSize: 12, // 粒子结束时的大小（比初始大小大，模拟水滴扩散）

        // 发射速率：每秒发射的粒子数量
        emissionRate: 100,

        // 粒子生命周期设置
        particleLifespan: 3.0, // 每个粒子存活3秒
        particleLifespanVariance: 0.5, // 生命周期随机变化±0.5秒

        // 初始速度：粒子发射时的速度
        speed: 100, // 初始速度100像素/秒
      },
    });
  });
}

// 执行测试函数，启动所有粒子系统演示
test();
