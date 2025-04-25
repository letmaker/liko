import type { Fixture } from "planck";
import type { RigidBody } from "./rigidBody";
import type { IShape } from "./rigidBody.interface";

/**
 * 添加物理形状到刚体
 * 根据形状类型创建不同的碰撞区域，支持矩形、圆形、边缘线和多边形
 * @param shape - 要添加的形状配置
 */
export function addShape(rigidBody: RigidBody, shape: IShape): void {
  if (!rigidBody.awaked) {
    rigidBody.shapes.push(shape);
    return;
  }
  const { physics: _physics, body } = rigidBody;

  const options = {
    density: 1,
    isSensor: rigidBody.isSensor,
    friction: rigidBody.friction,
    restitution: rigidBody.restitution,
    filterGroupIndex: 0,
    filterCategoryBits: _physics.getCategoryBit(rigidBody.category),
    filterMaskBits: _physics.getCategoryMask(rigidBody.categoryAccepted),
    ...shape,
  };
  const target = rigidBody.target;
  const rect = target.getWorldRotatingRect(rigidBody.scene);

  const physics = _physics;
  const { pl, toPh, toPhPos } = physics;

  let fixture: Fixture | undefined = undefined;
  const offsetX = toPh(shape.offset?.x ?? 0);
  const offsetY = toPh(shape.offset?.y ?? 0);
  switch (shape.shapeType) {
    case "box": {
      const hw = toPh(shape.width ?? rect.width) / 2;
      const hh = toPh(shape.height ?? rect.height) / 2;
      fixture = body.createFixture(new pl.Box(hw, hh, { x: hw + offsetX, y: hh + offsetY }), options);
      break;
    }
    case "circle": {
      const radius = toPh(shape.radius ?? rect.height / 2);
      // 修正圆心位置，确保与物体中心对齐
      const centerX = offsetX + radius;
      const centerY = offsetY + radius;
      fixture = body.createFixture(new pl.Circle({ x: centerX, y: centerY }, radius), options);
      break;
    }
    case "chain": {
      const vertices = shape.vertices.map((point) => toPhPos({ x: point.x + offsetX, y: point.y + offsetY }));
      // 检查顶点数量是否合法
      console.assert(vertices.length >= 2, "Chain shape must have at least 2 vertices");
      if (vertices.length < 2) return;
      fixture = body.createFixture(new pl.Chain(vertices, false), options);
      break;
    }
    case "polygon": {
      const vertices = shape.vertices.map((point) => toPhPos({ x: point.x + offsetX, y: point.y + offsetY }));
      // 检查顶点数量是否合法
      console.assert(vertices.length >= 3 && vertices.length <= 8, "Polygon shape must have 3-8 vertices");
      if (vertices.length < 3 || vertices.length > 8) return;
      fixture = body.createFixture(new pl.Polygon(vertices), options);
      break;
    }
  }

  if (options.crossSide) {
    fixture?.setUserData({ crossSide: options.crossSide });
  }
}
