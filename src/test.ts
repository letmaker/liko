// 测试专用，不会放到类库中
import { App, Text } from '.';

async function test() {
  const app = new App();
  await app.init({ width: 800, height: 800 });

  new Text({
    text: 'Hello World \n上下键盘切换 demo',
    textColor: '#ff0000',
    fontSize: 30,
    position: { x: 400, y: 400 },
    parent: app.stage,
    anchor: { x: 0.5, y: 0.5 },
    lineHeight: 100,
    textAlign: 'center',
  });
}

test();
