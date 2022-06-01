#version 300 es

precision mediump float;
uniform sampler2D u_texture;
uniform vec2 screenSize;
uniform float u_maxval;

out vec4 outColor;

float logMap(float x) {
    return log(1. + x)/log(1. + u_maxval);
}

void main() {
    vec3 col = texture(u_texture, gl_FragCoord.xy / screenSize).xyz;
    outColor = vec4(logMap(col.x), logMap(col.y), logMap(col.z), 1);
}