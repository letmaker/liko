import type { RigidBody } from "./rigidBody";
import type { IJoint } from "./rigidBody.interface";

export function addJoint(rigidBody: RigidBody, joint: IJoint): void {
  if (!rigidBody.awaked) {
    rigidBody.joints.push(joint);
    return;
  }
  const { physics, body } = rigidBody;
  const { pl, world } = physics;
  const toPhPos = physics.toPhPos.bind(physics);

  const localAnchorA = "localAnchorA" in joint ? toPhPos(joint.localAnchorA) : { x: 0, y: 0 };
  const localAnchorB = "localAnchorB" in joint ? toPhPos(joint.localAnchorB) : { x: 0, y: 0 };

  switch (joint.jointType) {
    case "revolute": {
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
      world.createJoint(new pl.RevoluteJoint(revoluteJointDef));
      break;
    }
    case "distance": {
      const distanceJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        collideConnected: joint.collideConnected,
        length: joint.length,
        frequencyHz: joint.frequency,
        dampingRatio: joint.dampingRatio,
      };
      world.createJoint(new pl.DistanceJoint(distanceJointDef));
      break;
    }
    case "fixed": {
      const fixedJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        collideConnected: joint.collideConnected,
        frequencyHz: joint.frequency,
        dampingRatio: joint.dampingRatio,
      };
      world.createJoint(new pl.WeldJoint(fixedJointDef));
      break;
    }
    case "prismatic": {
      const localAxisA = toPhPos(joint.localAxisA);
      const prismaticJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        localAxisA,
        collideConnected: joint.collideConnected,
        referenceAngle: joint.referenceAngle,
        enableLimit: joint.enableLimit,
        lowerTranslation: joint.lowerTranslation,
        upperTranslation: joint.upperTranslation,
        enableMotor: joint.enableMotor,
        maxMotorForce: joint.maxMotorForce,
        motorSpeed: joint.motorSpeed,
      };
      world.createJoint(new pl.PrismaticJoint(prismaticJointDef));
      break;
    }
    case "wheel": {
      const localAxisA = toPhPos(joint.localAxisA);
      const wheelJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        localAxisA,
        collideConnected: joint.collideConnected,
        enableMotor: joint.enableMotor,
        maxMotorTorque: joint.maxMotorTorque,
        motorSpeed: joint.motorSpeed,
        frequencyHz: joint.frequency || 2.0,
        dampingRatio: joint.dampingRatio || 0.7,
      };
      world.createJoint(new pl.WheelJoint(wheelJointDef));
      break;
    }
    case "rope": {
      const ropeJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        maxLength: joint.maxLength,
        collideConnected: joint.collideConnected,
      };
      world.createJoint(new pl.RopeJoint(ropeJointDef));
      break;
    }
    case "motor": {
      const linearOffset = joint.linearOffset ? toPhPos(joint.linearOffset) : { x: 0, y: 0 };
      const motorJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        collideConnected: joint.collideConnected !== false, // 默认为true
        linearOffset,
        angularOffset: joint.angularOffset || 0,
        maxForce: joint.maxForce || 1.0,
        maxTorque: joint.maxTorque || 1.0,
        correctionFactor: joint.correctionFactor || 0.3,
      };
      world.createJoint(new pl.MotorJoint(motorJointDef));
      break;
    }
    case "pulley": {
      const groundAnchorA = toPhPos(joint.groundAnchorA);
      const groundAnchorB = toPhPos(joint.groundAnchorB);
      const pulleyJointDef = {
        bodyA: body,
        bodyB: joint.targetBody.body,
        localAnchorA,
        localAnchorB,
        groundAnchorA,
        groundAnchorB,
        lengthA: joint.lengthA,
        lengthB: joint.lengthB,
        ratio: joint.ratio,
        collideConnected: joint.collideConnected !== false, // 默认为true
      };
      world.createJoint(new pl.PulleyJoint(pulleyJointDef));
      break;
    }
  }
}
