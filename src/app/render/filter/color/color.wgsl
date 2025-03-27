struct VertexInput {
  @location(0) xy: vec2<f32>,
  @location(1) uv: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@group(0) @binding(0) var<uniform> projection: mat4x4<f32>;
@group(0) @binding(1) var tex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

@vertex
fn vert_main(input: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.pos = projection * vec4<f32>(input.xy, 0.0, 1.0);
    out.uv = input.uv;
    return out;
}

struct FilterUniforms {
  uColorMatrix: array<vec4<f32>, 5>,
  uAlpha: f32,
};
@group(1) @binding(0) var<uniform> filterUniforms : FilterUniforms;

@fragment
fn frag_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    var color = textureSample(tex, samp, uv);
    if filterUniforms.uAlpha == 0.0 {
        return color;
    }
    
    // Un-premultiply alpha before applying the color matrix. See issue #3539.
    if color.a > 0.0 {
        color.r /= color.a;
        color.g /= color.a;
        color.b /= color.a;
    }

    let cm = filterUniforms.uColorMatrix;
    var result = vec4<f32>(0.);

    result.r = (cm[0][0] * color.r);
    result.r += (cm[0][1] * color.g);
    result.r += (cm[0][2] * color.b);
    result.r += (cm[0][3] * color.a);
    result.r += cm[1][0];

    result.g = (cm[1][1] * color.r);
    result.g += (cm[1][2] * color.g);
    result.g += (cm[1][3] * color.b);
    result.g += (cm[2][0] * color.a);
    result.g += cm[2][1];

    result.b = (cm[2][2] * color.r);
    result.b += (cm[2][3] * color.g);
    result.b += (cm[3][0] * color.b);
    result.b += (cm[3][1] * color.a);
    result.b += cm[3][2];

    result.a = (cm[3][3] * color.r);
    result.a += (cm[4][0] * color.g);
    result.a += (cm[4][1] * color.b);
    result.a += (cm[4][2] * color.a);
    result.a += cm[4][3];

    var rgb = mix(color.rgb, result.rgb, filterUniforms.uAlpha);

    rgb.r *= result.a;
    rgb.g *= result.a;
    rgb.b *= result.a;

    return vec4(rgb, result.a);
}