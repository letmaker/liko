import type { Joint } from "planck";
import type { RigidBody } from "./rigidBody";
import type { IJoint } from "./rigidBody.interface";

export function addJoint(rigidBody: RigidBody, joint: IJoint): Joint | null {
  if (!rigidBody.awaked) {
    rigidBody.joints.push(joint);
    return null;
  }
  const { physics, body, target } = rigidBody;
  const { pl, world, toPhPos, toPh } = physics;

  switch (joint.jointType) {
    case "revolute": {
      const { localAnchorA, localAnchorB } = getLocalAnchorAB(rigidBody, joint);
      const revoluteJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        collideConnected: joint.collideConnected,
        enableLimit: joint.enableLimit,
        lowerAngle: joint.lowerAngle,
        upperAngle: joint.upperAngle,
        enableMotor: joint.enableMotor,
        maxMotorTorque: joint.maxMotorTorque,
        motorSpeed: joint.motorSpeed,
      };
      return world.createJoint(new pl.RevoluteJoint(revoluteJointDef));
    }
    case "distance": {
      const { localAnchorA, localAnchorB } = getLocalAnchorAB(rigidBody, joint);
      const distanceJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        collideConnected: joint.collideConnected,
        length: toPh(joint.length ?? 10),
        frequencyHz: joint.frequency,
        dampingRatio: joint.dampingRatio,
      };
      return world.createJoint(new pl.DistanceJoint(distanceJointDef));
    }
    case "fixed": {
      const { localAnchorA, localAnchorB } = getLocalAnchorAB(rigidBody, joint);
      const fixedJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        collideConnected: joint.collideConnected,
        frequencyHz: joint.frequency,
        dampingRatio: joint.dampingRatio,
      };
      return world.createJoint(new pl.WeldJoint(fixedJointDef));
    }
    case "prismatic": {
      const { localAnchorA, localAnchorB } = getLocalAnchorAB(rigidBody, joint);
      const prismaticJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        localAxisA: { x: -joint.localAxis.x, y: -joint.localAxis.y },
        collideConnected: joint.collideConnected,
        enableLimit: joint.enableLimit,
        lowerTranslation: joint.lowerTranslation ? toPh(joint.lowerTranslation) : undefined,
        upperTranslation: joint.upperTranslation ? toPh(joint.upperTranslation) : undefined,
        enableMotor: joint.enableMotor,
        maxMotorForce: joint.maxMotorForce,
        motorSpeed: joint.motorSpeed,
      };
      return world.createJoint(new pl.PrismaticJoint(prismaticJointDef));
    }
    case "wheel": {
      const { localAnchorA, localAnchorB } = getLocalAnchorAB(rigidBody, joint);
      const wheelJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        localAxisA: { x: -joint.localAxis.x, y: -joint.localAxis.y },
        collideConnected: joint.collideConnected,
        enableMotor: joint.enableMotor,
        maxMotorTorque: joint.maxMotorTorque,
        motorSpeed: joint.motorSpeed,
        frequencyHz: joint.frequency || 2.0,
        dampingRatio: joint.dampingRatio || 0.7,
      };
      return world.createJoint(new pl.WheelJoint(wheelJointDef));
    }
    case "rope": {
      const { localAnchorA, localAnchorB } = getLocalAnchorAB(rigidBody, joint);
      const ropeJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        maxLength: toPh(joint.maxLength),
        collideConnected: joint.collideConnected,
      };
      return world.createJoint(new pl.RopeJoint(ropeJointDef));
    }
    case "motor": {
      const linearOffset = joint.linearOffset ? toPhPos(joint.linearOffset) : { x: 0, y: 0 };
      const motorJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        collideConnected: joint.collideConnected !== false, // 默认为true
        linearOffset,
        angularOffset: joint.angularOffset ?? 0,
        maxForce: joint.maxForce ?? 1.0,
        maxTorque: joint.maxTorque ?? 1.0,
        correctionFactor: joint.correctionFactor ?? 0.3,
      };
      return world.createJoint(new pl.MotorJoint(motorJointDef));
    }
    case "pulley": {
      const targetB = joint.targetBody.target;
      const localA = { x: joint.localAnchorA.x + target.pivot.x, y: joint.localAnchorA.y + target.pivot.y };
      const localB = { x: joint.localAnchorB.x + targetB.pivot.x, y: joint.localAnchorB.y + targetB.pivot.y };
      const localAnchorA = toPhPos(localA);
      const localAnchorB = toPhPos(localB);
      const groundAnchorA = toPhPos(joint.groundAnchorA);
      const groundAnchorB = toPhPos(joint.groundAnchorB);
      const pulleyJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        groundAnchorA,
        groundAnchorB,
        lengthA: toPh(joint.lengthA),
        lengthB: toPh(joint.lengthB),
        ratio: joint.ratio,
        collideConnected: joint.collideConnected !== false, // 默认为true
      };
      return world.createJoint(new pl.PulleyJoint(pulleyJointDef));
    }
  }
}

function getLocalAnchorAB(rigidBody: RigidBody, joint: IJoint) {
  if ("localAnchor" in joint) {
    const { physics, target } = rigidBody;
    const localA = { x: joint.localAnchor.x + target.pivot.x, y: joint.localAnchor.y + target.pivot.y };
    const localB = joint.targetBody.target.worldToLocal(target.localToWorld(localA));
    const localAnchorA = physics.toPhPos(localA);
    const localAnchorB = physics.toPhPos(localB);
    return { localAnchorA, localAnchorB };
  }
  return { localAnchorA: { x: 0, y: 0 }, localAnchorB: { x: 0, y: 0 } };
}
