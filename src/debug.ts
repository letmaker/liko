// 使用优化后的粒子系统进行简化测试
import { App, ParticleSystem } from '.';

async function optimizedTest() {
  console.log('🚀 开始优化后的粒子系统测试...');

  // 初始化App
  const app = new App();
  await app.init({
    width: 800,
    height: 800,
    bgColor: '#222222',
  });

  console.log('✅ App初始化完成');

  // 使用简化的API创建粒子系统
  const particles = new ParticleSystem({
    url: 'assets/fire2.plist',
  });

  // 添加到舞台
  app.stage.addChild(particles);
  particles.position.set(400, 600); // 底部中央
  particles.play();
}

optimizedTest();
