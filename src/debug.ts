// 调试文件，不会包含在引擎内
import { App, ParticleSystem } from '.';

async function test() {
  const app = new App();
  await app.init({
    width: 800,
    height: 800,
    bgColor: '#333333',
  });

  console.log('开始创建第一个粒子系统...');
  const particles1 = new ParticleSystem({
    url: 'assets/fire2.plist',
    parent: app.stage,
    position: { x: 400, y: 300 },
  });
  particles1.play();

  const particles2 = new ParticleSystem({
    url: 'assets/fire2.plist',
    parent: app.stage,
    position: { x: 400, y: 600 },
  });
  particles2.play();
}

test();
