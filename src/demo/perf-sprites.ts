import { App } from "../app/app";
import { Container } from "../app/nodes/container";
import { Sprite } from "../app/nodes/sprite";
import { Texture } from "../app/resource/texture";

const count = 10;

async function test() {
  const app = new App();
  await app.init({ width: 800, height: 800 });
  console.log("test count", count / 10000, "W");

  const texture1 = await Texture.from("assets/apple2.png");
  const texture2 = await Texture.from("assets/strawberry2.png");

  console.time("create node");
  const container = new Container();
  // container.cache = true;
  // container.alpha = 0.1;
  app.stage.addChild(container);

  for (let i = 0; i < count; i++) {
    const texture = i % 2 === 0 ? texture1 : texture2;
    const sprite = new Sprite({
      texture,
      label: `sprite${i}`,
      pos: { x: Math.random() * 800, y: Math.random() * 800 },
      scale: { x: 0.2, y: 0.2 },
      rotation: Math.random() * Math.PI * 2,
      width: texture.width,
      height: texture.height,
      data: { speed: Math.random() * 10 + 2 },
    });
    // sprite.tint = "#ffff00";
    container.addChild(sprite);
  }

  console.timeEnd("create node");

  function render2() {
    for (let i = 0; i < count; i++) {
      const sprite = container.children[i];
      sprite.pos.y += sprite.data.speed;
      if (sprite.pos.y > 800) {
        sprite.pos.y = -texture1.height;
      }
    }
    requestAnimationFrame(render2);
  }
  render2();
}

test();
