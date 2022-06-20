#version 300 es

precision mediump float;
uniform sampler2D u_texture;
uniform vec2 screenSize;

uniform int u_mode;

out vec4 outColor;

void main() {
    vec3 col = texture(u_texture, gl_FragCoord.xy / screenSize).xyz;
    vec3 negCol = vec3(1.) - col;

    outColor = vec4(negCol, 1.);
}