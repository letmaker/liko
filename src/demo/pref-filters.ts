import { App } from "../app/app";
import { Container } from "../app/nodes/container";
import { Sprite } from "../app/nodes/sprite";
import { ColorFilter } from "../app/render/filter/color/color-filter";
import { Texture } from "../app/resource/texture";

const count = 1000;
async function test() {
  const app = new App();
  await app.init({ width: 800, height: 800 });
  console.log("test count", count);

  const texture = await Texture.from("assets/apple2.png");

  for (let i = 0; i < count; i++) {
    const container = new Container();
    container.width = 80;
    container.height = 80;
    container.label = `container${i}`;
    // container.pos.x = 50 * i + 100;
    // container.pos.y = 50 * i + 100;
    container.pos.x = Math.random() * 800;
    container.pos.y = Math.random() * 800;
    container.addFilter(new ColorFilter());
    app.stage.addChild(container);

    const sprite = new Sprite(texture);
    // sprite.data.speed = Math.random() * 10 + 2;
    container.addChild(sprite);
  }

  const texture2 = await Texture.from("assets/boat.jpeg");
  const sprite = new Sprite(texture2);
  sprite.scale.set(0.5);
  sprite.pos.set(300);
  app.stage.addChild(sprite);

  function render() {
    // sprite.rotation += 0.01;
    // for (let i = 0; i < count; i++) {
    // const sprite = app.stage.children[i];
    // sprite.rotation += 0.1;
    // sprite.pos.y += sprite.data.speed;
    // if (sprite.pos.y > 800) {
    //   sprite.pos.y = -texture.height;
    // }
    // }
    requestAnimationFrame(render);
  }
  render();
}
test();
