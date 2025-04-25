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

  const localAnchor = "localAnchor" in joint ? joint.localAnchor : { x: 0, y: 0 };
  const localA = { x: localAnchor.x + target.pivot.x, y: localAnchor.y + target.pivot.y };
  const localB = joint.targetBody.target.worldToLocal(target.localToWorld(localA));
  const localAnchorA = toPhPos(localA);
  const localAnchorB = toPhPos(localB);

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
      return world.createJoint(new pl.RevoluteJoint(revoluteJointDef));
    }
    case "distance": {
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
    // case "prismatic": {
    //   const localAxisA = toPhPos(joint.localAxisA);
    //   const prismaticJointDef = {
    //     bodyA: body,
    //     bodyB: joint.targetBody.body,
    //     localAnchorA,
    //     localAnchorB,
    //     localAxisA,
    //     collideConnected: joint.collideConnected,
    //     referenceAngle: joint.referenceAngle,
    //     enableLimit: joint.enableLimit,
    //     lowerTranslation: joint.lowerTranslation,
    //     upperTranslation: joint.upperTranslation,
    //     enableMotor: joint.enableMotor,
    //     maxMotorForce: joint.maxMotorForce,
    //     motorSpeed: joint.motorSpeed,
    //   };
    //   return world.createJoint(new pl.PrismaticJoint(prismaticJointDef));
    // }
    // case "wheel": {
    //   const localAxisA = toPhPos(joint.localAxisA);
    //   const wheelJointDef = {
    //     bodyA: body,
    //     bodyB: joint.targetBody.body,
    //     localAnchorA,
    //     localAnchorB,
    //     localAxisA,
    //     collideConnected: joint.collideConnected,
    //     enableMotor: joint.enableMotor,
    //     maxMotorTorque: joint.maxMotorTorque,
    //     motorSpeed: joint.motorSpeed,
    //     frequencyHz: joint.frequency || 2.0,
    //     dampingRatio: joint.dampingRatio || 0.7,
    //   };
    //   return world.createJoint(new pl.WheelJoint(wheelJointDef));
    // }
    // case "rope": {
    //   const ropeJointDef = {
    //     bodyA: body,
    //     bodyB: joint.targetBody.body,
    //     localAnchorA,
    //     localAnchorB,
    //     maxLength: joint.maxLength,
    //     collideConnected: joint.collideConnected,
    //   };
    //   return world.createJoint(new pl.RopeJoint(ropeJointDef));
    // }
    // case "motor": {
    //   const linearOffset = joint.linearOffset ? toPhPos(joint.linearOffset) : { x: 0, y: 0 };
    //   const motorJointDef = {
    //     bodyA: body,
    //     bodyB: joint.targetBody.body,
    //     collideConnected: joint.collideConnected !== false, // 默认为true
    //     linearOffset,
    //     angularOffset: joint.angularOffset || 0,
    //     maxForce: joint.maxForce || 1.0,
    //     maxTorque: joint.maxTorque || 1.0,
    //     correctionFactor: joint.correctionFactor || 0.3,
    //   };
    //   return world.createJoint(new pl.MotorJoint(motorJointDef));
    // }
    // case "pulley": {
    //   const groundAnchorA = toPhPos(joint.groundAnchorA);
    //   const groundAnchorB = toPhPos(joint.groundAnchorB);
    //   const pulleyJointDef = {
    //     bodyA: body,
    //     bodyB: joint.targetBody.body,
    //     localAnchorA,
    //     localAnchorB,
    //     groundAnchorA,
    //     groundAnchorB,
    //     lengthA: joint.lengthA,
    //     lengthB: joint.lengthB,
    //     ratio: joint.ratio,
    //     collideConnected: joint.collideConnected !== false, // 默认为true
    //   };
    //   return world.createJoint(new pl.PulleyJoint(pulleyJointDef));
    // }
  }
  return null;
}
