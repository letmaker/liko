// 测试专用，不会放到类库中
import { App, Shape } from '.';

async function test() {
  const app = new App();
  await app.init({ width: 800, height: 800, bgColor: 0x333333 });

  new Shape({
    label: 'rect',
    drawLine: {
      points: [
        { x: 50, y: 50 },
        { x: 250, y: 250 },
      ],
      color: 0x000000,
      lineWidth: 10,
    },
    position: { x: 200, y: 0 },
    parent: app.stage,
  });
}

test();
