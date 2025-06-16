import type { ParticleConfig } from './particle-config';
import {
  type BlendFuncDestination,
  type BlendFuncSource,
  DEFAULT_PARTICLE_CONFIG,
  EmitterMode,
  type PositionType,
} from './particle-config';

/**
 * plist XML解析器
 * 用于解析cocos-engine兼容的粒子系统配置文件
 */
export namespace PlistParser {
  /**
   * 解析plist格式的粒子配置
   * @param plistContent - plist文件内容（XML字符串）
   * @returns 解析后的粒子配置对象
   */
  export function parseParticleConfig(plistContent: string): ParticleConfig {
    const parser = new DOMParser();
    const doc = parser.parseFromString(plistContent, 'text/xml');

    // 检查解析错误
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`plist解析错误: ${parserError.textContent}`);
    }

    const dict = doc.querySelector('plist > dict');
    if (!dict) {
      throw new Error('无效的plist格式：未找到根字典');
    }

    // 创建配置对象，使用默认值
    const config: ParticleConfig = { ...DEFAULT_PARTICLE_CONFIG };

    // 解析字典
    parseDict(dict, config);

    return config;
  }

  /**
   * 解析字典元素
   * @param dict - 字典DOM元素
   * @param config - 要填充的配置对象
   */
  function parseDict(dict: Element, config: ParticleConfig): void {
    const children = dict.children;

    for (let i = 0; i < children.length; i += 2) {
      const keyElement = children[i];
      const valueElement = children[i + 1];

      if (!keyElement || !valueElement) continue;
      if (keyElement.tagName !== 'key') continue;

      const key = keyElement.textContent?.trim();
      if (!key) continue;

      const value = parseValue(valueElement);
      setConfigValue(config, key, value);
    }
  }

  /**
   * 解析值元素
   * @param element - 值DOM元素
   * @returns 解析后的值
   */
  function parseValue(element: Element): unknown {
    const tagName = element.tagName.toLowerCase();
    const content = element.textContent?.trim() || '';

    switch (tagName) {
      case 'real':
      case 'integer':
        return Number(content);
      case 'string':
        return content;
      case 'true':
        return true;
      case 'false':
        return false;
      case 'dict': {
        const dict: Record<string, unknown> = {};
        parseDict(element, dict as unknown as ParticleConfig);
        return dict;
      }
      case 'array':
        return parseArray(element);
      default:
        return content;
    }
  }

  /**
   * 解析数组元素
   * @param array - 数组DOM元素
   * @returns 解析后的数组
   */
  function parseArray(array: Element): unknown[] {
    const result: unknown[] = [];
    const children = array.children;

    for (let i = 0; i < children.length; i++) {
      result.push(parseValue(children[i]));
    }

    return result;
  }

  /**
   * 设置配置值
   * @param config - 配置对象
   * @param key - 键名
   * @param value - 值
   */
  function setConfigValue(config: ParticleConfig, key: string, value: unknown): void {
    // 映射plist中的键名到配置属性名
    const keyMap: Record<string, keyof ParticleConfig> = {
      // 基础配置
      emitterType: 'emitterMode',
      positionType: 'positionType',
      maxParticles: 'maxParticles',
      duration: 'duration',
      emissionRate: 'emissionRate',

      // 粒子生命周期
      particleLifespan: 'particleLifespan',
      particleLifespanVariance: 'particleLifespanVariance',

      // 发射器位置
      sourcePositionx: 'sourcePositionX',
      sourcePositiony: 'sourcePositionY',
      sourcePositionVariancex: 'sourcePositionVarianceX',
      sourcePositionVariancey: 'sourcePositionVarianceY',

      // 粒子大小
      startParticleSize: 'startParticleSize',
      startParticleSizeVariance: 'startParticleSizeVariance',
      finishParticleSize: 'finishParticleSize',
      finishParticleSizeVariance: 'finishParticleSizeVariance',

      // 粒子旋转
      rotationStart: 'rotationStart',
      rotationStartVariance: 'rotationStartVariance',
      rotationEnd: 'rotationEnd',
      rotationEndVariance: 'rotationEndVariance',

      // 粒子颜色
      startColorRed: 'startColorRed',
      startColorGreen: 'startColorGreen',
      startColorBlue: 'startColorBlue',
      startColorAlpha: 'startColorAlpha',
      startColorVarianceRed: 'startColorVarianceRed',
      startColorVarianceGreen: 'startColorVarianceGreen',
      startColorVarianceBlue: 'startColorVarianceBlue',
      startColorVarianceAlpha: 'startColorVarianceAlpha',

      finishColorRed: 'finishColorRed',
      finishColorGreen: 'finishColorGreen',
      finishColorBlue: 'finishColorBlue',
      finishColorAlpha: 'finishColorAlpha',
      finishColorVarianceRed: 'finishColorVarianceRed',
      finishColorVarianceGreen: 'finishColorVarianceGreen',
      finishColorVarianceBlue: 'finishColorVarianceBlue',
      finishColorVarianceAlpha: 'finishColorVarianceAlpha',

      // 重力模式
      gravityx: 'gravityX',
      gravityy: 'gravityY',
      speed: 'speed',
      speedVariance: 'speedVariance',
      radialAcceleration: 'radialAcceleration',
      radialAccelVariance: 'radialAccelVariance',
      tangentialAcceleration: 'tangentialAcceleration',
      tangentialAccelVariance: 'tangentialAccelVariance',
      angle: 'angle',
      angleVariance: 'angleVariance',
      rotationIsDir: 'rotationIsDir',

      // 径向模式
      maxRadius: 'maxRadius',
      maxRadiusVariance: 'maxRadiusVariance',
      minRadius: 'minRadius',
      rotatePerSecond: 'rotatePerSecond',
      rotatePerSecondVariance: 'rotatePerSecondVariance',

      // 渲染属性
      textureFileName: 'textureFileName',
      textureImageData: 'textureImageData',
      blendFuncSource: 'blendFuncSource',
      blendFuncDestination: 'blendFuncDestination',
    };

    const configKey = keyMap[key];
    if (configKey) {
      // 特殊处理某些值
      if (configKey === 'emitterMode') {
        config[configKey] = value === 1 ? EmitterMode.RADIUS : EmitterMode.GRAVITY;
      } else if (configKey === 'positionType') {
        config[configKey] = value as PositionType;
      } else if (configKey === 'blendFuncSource') {
        config[configKey] = value as BlendFuncSource;
      } else if (configKey === 'blendFuncDestination') {
        config[configKey] = value as BlendFuncDestination;
      } else if (configKey === 'angle' || configKey === 'angleVariance') {
        // 角度转换：度转弧度
        config[configKey] = ((value as number) * Math.PI) / 180;
      } else {
        (config as unknown as Record<string, unknown>)[configKey] = value;
      }
    }
  }

  /**
   * 将粒子配置导出为plist格式
   * @param config - 粒子配置对象
   * @returns plist格式的XML字符串
   */
  export function exportParticleConfig(config: ParticleConfig): string {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
      '<plist version="1.0">',
      '<dict>',
    ];

    // 反向键映射
    const reverseKeyMap: Record<keyof ParticleConfig, string> = {
      emitterMode: 'emitterType',
      positionType: 'positionType',
      maxParticles: 'maxParticles',
      duration: 'duration',
      emissionRate: 'emissionRate',

      particleLifespan: 'particleLifespan',
      particleLifespanVariance: 'particleLifespanVariance',

      sourcePositionX: 'sourcePositionx',
      sourcePositionY: 'sourcePositiony',
      sourcePositionVarianceX: 'sourcePositionVariancex',
      sourcePositionVarianceY: 'sourcePositionVariancey',

      startParticleSize: 'startParticleSize',
      startParticleSizeVariance: 'startParticleSizeVariance',
      finishParticleSize: 'finishParticleSize',
      finishParticleSizeVariance: 'finishParticleSizeVariance',

      rotationStart: 'rotationStart',
      rotationStartVariance: 'rotationStartVariance',
      rotationEnd: 'rotationEnd',
      rotationEndVariance: 'rotationEndVariance',

      startColorRed: 'startColorRed',
      startColorGreen: 'startColorGreen',
      startColorBlue: 'startColorBlue',
      startColorAlpha: 'startColorAlpha',
      startColorVarianceRed: 'startColorVarianceRed',
      startColorVarianceGreen: 'startColorVarianceGreen',
      startColorVarianceBlue: 'startColorVarianceBlue',
      startColorVarianceAlpha: 'startColorVarianceAlpha',

      finishColorRed: 'finishColorRed',
      finishColorGreen: 'finishColorGreen',
      finishColorBlue: 'finishColorBlue',
      finishColorAlpha: 'finishColorAlpha',
      finishColorVarianceRed: 'finishColorVarianceRed',
      finishColorVarianceGreen: 'finishColorVarianceGreen',
      finishColorVarianceBlue: 'finishColorVarianceBlue',
      finishColorVarianceAlpha: 'finishColorVarianceAlpha',

      gravityX: 'gravityx',
      gravityY: 'gravityy',
      speed: 'speed',
      speedVariance: 'speedVariance',
      radialAcceleration: 'radialAcceleration',
      radialAccelVariance: 'radialAccelVariance',
      tangentialAcceleration: 'tangentialAcceleration',
      tangentialAccelVariance: 'tangentialAccelVariance',
      angle: 'angle',
      angleVariance: 'angleVariance',
      rotationIsDir: 'rotationIsDir',

      maxRadius: 'maxRadius',
      maxRadiusVariance: 'maxRadiusVariance',
      minRadius: 'minRadius',
      rotatePerSecond: 'rotatePerSecond',
      rotatePerSecondVariance: 'rotatePerSecondVariance',

      textureFileName: 'textureFileName',
      textureImageData: 'textureImageData',
      blendFuncSource: 'blendFuncSource',
      blendFuncDestination: 'blendFuncDestination',
    };

    // 生成键值对
    for (const [configKey, plistKey] of Object.entries(reverseKeyMap)) {
      const value = config[configKey as keyof ParticleConfig];
      if (value !== undefined) {
        xml.push(`    <key>${plistKey}</key>`);

        let xmlValue: string;
        if (typeof value === 'number') {
          // 角度特殊处理：弧度转度
          if (configKey === 'angle' || configKey === 'angleVariance') {
            xmlValue = `<real>${(value * 180) / Math.PI}</real>`;
          } else if (Number.isInteger(value)) {
            xmlValue = `<integer>${value}</integer>`;
          } else {
            xmlValue = `<real>${value}</real>`;
          }
        } else if (typeof value === 'boolean') {
          xmlValue = value ? '<true/>' : '<false/>';
        } else {
          xmlValue = `<string>${value}</string>`;
        }

        xml.push(`    ${xmlValue}`);
      }
    }

    xml.push('</dict>');
    xml.push('</plist>');

    return xml.join('\n');
  }
}
