# version 300 es
in vec2 aPos;
in vec4 aColor;
in vec2 aUV;
in float aTextureId;

uniform mat4 uProjection;

out vec4 vColor;
out vec2 vUV;
out float vId;

void main(void) {
    gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
    vUV = aUV;
    vColor = aColor;
    // vColor = vec4(aColor.rgb * aColor.a, aColor.a);
    vId = aTextureId;
}