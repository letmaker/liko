struct VertexInput {
  @location(0) aPos: vec2<f32>,
  @location(1) aColor: vec4<f32>,
  @location(2) aUV: vec2<f32>,
  @location(3) aTextureId: u32,
};

struct VertexOutput {
  @builtin(position) vPos: vec4<f32>,
  @location(0) vUV: vec2<f32>,
  @location(1) vColor: vec4<f32>,
  @location(2) @interpolate(flat) vId: u32,
};

@group(0) @binding(0) var<uniform> uProjection: mat4x4<f32>;

@vertex
fn vert_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.vPos = uProjection * vec4<f32>(input.aPos, 0.0, 1.0);
    output.vUV = input.aUV;
    output.vColor = input.aColor;
    output.vId = input.aTextureId;
    return output;
}

@group(1) @binding(0) var texture1: texture_2d<f32>;
@group(1) @binding(1) var sampler1: sampler;
@group(1) @binding(2) var texture2: texture_2d<f32>;
@group(1) @binding(3) var sampler2: sampler;
@group(1) @binding(4) var texture3: texture_2d<f32>;
@group(1) @binding(5) var sampler3: sampler;
@group(1) @binding(6) var texture4: texture_2d<f32>;
@group(1) @binding(7) var sampler4: sampler;
@group(1) @binding(8) var texture5: texture_2d<f32>;
@group(1) @binding(9) var sampler5: sampler;
@group(1) @binding(10) var texture6: texture_2d<f32>;
@group(1) @binding(11) var sampler6: sampler;
@group(1) @binding(12) var texture7: texture_2d<f32>;
@group(1) @binding(13) var sampler7: sampler;
@group(1) @binding(14) var texture8: texture_2d<f32>;
@group(1) @binding(15) var sampler8: sampler;
@group(1) @binding(16) var texture9: texture_2d<f32>;
@group(1) @binding(17) var sampler9: sampler;
@group(1) @binding(18) var texture10: texture_2d<f32>;
@group(1) @binding(19) var sampler10: sampler;
@group(1) @binding(20) var texture11: texture_2d<f32>;
@group(1) @binding(21) var sampler11: sampler;
@group(1) @binding(22) var texture12: texture_2d<f32>;
@group(1) @binding(23) var sampler12: sampler;
@group(1) @binding(24) var texture13: texture_2d<f32>;
@group(1) @binding(25) var sampler13: sampler;
@group(1) @binding(26) var texture14: texture_2d<f32>;
@group(1) @binding(27) var sampler14: sampler;
@group(1) @binding(28) var texture15: texture_2d<f32>;
@group(1) @binding(29) var sampler15: sampler;
@group(1) @binding(30) var texture16: texture_2d<f32>;
@group(1) @binding(31) var sampler16: sampler;

@fragment
fn frag_main(
    @location(0) vUV: vec2<f32>,
    @location(1) vColor: vec4<f32>,
    @location(2) @interpolate(flat) vId: u32,
) -> @location(0) vec4<f32> {
    var outColor: vec4<f32>;
    var uvDx = dpdx(vUV);
    var uvDy = dpdy(vUV);

    switch vId {
        case 0:{
            outColor = textureSampleGrad(texture1, sampler1, vUV, uvDx, uvDy);
            break;
        }
        case 1:{
            outColor = textureSampleGrad(texture2, sampler2, vUV, uvDx, uvDy);
            break;
        }
        case 2:{
            outColor = textureSampleGrad(texture3, sampler3, vUV, uvDx, uvDy);
            break;
        }
        case 3:{
            outColor = textureSampleGrad(texture4, sampler4, vUV, uvDx, uvDy);
            break;
        }
        case 4:{
            outColor = textureSampleGrad(texture5, sampler5, vUV, uvDx, uvDy);
            break;
        }
        case 5:{
            outColor = textureSampleGrad(texture6, sampler6, vUV, uvDx, uvDy);
            break;
        }
        case 6:{
            outColor = textureSampleGrad(texture7, sampler7, vUV, uvDx, uvDy);
            break;
        }
        case 7:{
            outColor = textureSampleGrad(texture8, sampler8, vUV, uvDx, uvDy);
            break;
        }
        case 8:{
            outColor = textureSampleGrad(texture9, sampler9, vUV, uvDx, uvDy);
            break;
        }
        case 9:{
            outColor = textureSampleGrad(texture10, sampler10, vUV, uvDx, uvDy);
            break;
        }
        case 10:{
            outColor = textureSampleGrad(texture11, sampler11, vUV, uvDx, uvDy);
            break;
        }
        case 11:{
            outColor = textureSampleGrad(texture12, sampler12, vUV, uvDx, uvDy);
            break;
        }
        case 12:{
            outColor = textureSampleGrad(texture13, sampler13, vUV, uvDx, uvDy);
            break;
        }
        case 13:{
            outColor = textureSampleGrad(texture14, sampler14, vUV, uvDx, uvDy);
            break;
        }
        case 14:{
            outColor = textureSampleGrad(texture15, sampler15, vUV, uvDx, uvDy);
            break;
        }
        default:{
            outColor = textureSampleGrad(texture16, sampler16, vUV, uvDx, uvDy);
            break;
        }
    }
    return outColor * vColor;
}