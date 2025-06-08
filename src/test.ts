// 测试专用，不会放到正式代码中
import { App, Shape, Sprite } from '.';

async function test() {
  const app = new App();
  await app.init({ width: 800, height: 800, bgColor: 0x333333 });

  new Shape({
    label: 'rect',
    drawRect: {
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      fill: '#00ff00',
      stroke: '#0000ff',
      strokeWidth: 2,
    },
    position: { x: 200, y: 0 },
    parent: app.stage,
  });

  new Shape({
    label: 'roundedRect',
    drawRoundedRect: {
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      cornerRadius: 10,
      fill: '#00ff00',
      stroke: '#0000ff',
      strokeWidth: 2,
    },
    position: { x: 400, y: 0 },
    parent: app.stage,
  });

  new Sprite({
    label: 'apple',
    url: 'assets/apple.png',
    scale: { x: 0.5, y: 0.5 },
    anchor: { x: 0.5, y: 0.5 },
    position: { x: 400, y: 400 },
    parent: app.stage,
  });
}

test();
