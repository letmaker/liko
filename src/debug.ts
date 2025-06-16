// 使用优化后的粒子系统进行简化测试
import { App, ParticleSystem, Texture } from '.';

async function optimizedTest() {
  console.log('🚀 开始优化后的粒子系统测试...');

  // 创建容器
  const container = document.createElement('div');
  container.id = 'optimized-test';
  document.body.appendChild(container);

  // 初始化App
  const app = new App();
  await app.init({
    width: 800,
    height: 800,
    container: 'optimized-test',
    bgColor: '#222222',
  });

  console.log('✅ App初始化完成');

  // 加载纹理
  const texture = await Texture.createFromUrl('assets/fire.png');

  // 使用简化的API创建粒子系统
  const particles = new ParticleSystem({
    texture,
    maxParticles: 100, // 减少粒子数量提高性能
    emissionRate: 30, // 降低发射速率
    particleLifespan: 2.0,

    startColor: { r: 1.0, g: 0.2, b: 0.0, a: 1.0 }, // 火焰色
    endColor: { r: 1.0, g: 1.0, b: 0.0, a: 0.0 }, // 黄色透明

    startSize: 32,
    endSize: 16,

    gravity: { x: 0, y: 50 },
    speed: 80,
    angle: 270, // 向上
  });

  // 添加到舞台
  app.stage.addChild(particles);
  particles.position.set(400, 600); // 底部中央
  particles.play();
}

optimizedTest();
