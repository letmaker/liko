# version 300 es
precision mediump float;
in vec4 vColor;
in vec2 vUV;
in float vId;

uniform sampler2D uTextures[16];
out vec4 finalColor;

void main(void) {
    vec4 outColor;
    if(vId < 0.5) {
        outColor = texture(uTextures[0], vUV);
    } else if(vId < 1.5) {
        outColor = texture(uTextures[1], vUV);
    } else if(vId < 2.5) {
        outColor = texture(uTextures[2], vUV);
    } else if(vId < 3.5) {
        outColor = texture(uTextures[3], vUV);
    } else if(vId < 4.5) {
        outColor = texture(uTextures[4], vUV);
    } else if(vId < 5.5) {
        outColor = texture(uTextures[5], vUV);
    } else if(vId < 6.5) {
        outColor = texture(uTextures[6], vUV);
    } else if(vId < 7.5) {
        outColor = texture(uTextures[7], vUV);
    } else if(vId < 8.5) {
        outColor = texture(uTextures[8], vUV);
    } else if(vId < 9.5) {
        outColor = texture(uTextures[9], vUV);
    } else if(vId < 10.5) {
        outColor = texture(uTextures[10], vUV);
    } else if(vId < 11.5) {
        outColor = texture(uTextures[11], vUV);
    } else if(vId < 12.5) {
        outColor = texture(uTextures[12], vUV);
    } else if(vId < 13.5) {
        outColor = texture(uTextures[13], vUV);
    } else if(vId < 14.5) {
        outColor = texture(uTextures[14], vUV);
    } else {
        outColor = texture(uTextures[0], vUV);
    }
    finalColor = outColor * vColor;
}
