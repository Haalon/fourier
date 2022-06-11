#version 300 es

precision mediump float;
uniform sampler2D u_x;
uniform sampler2D u_y;
uniform vec2 screenSize;

// uniform float u_maxval;

#define PI 3.1415926535897932384626433832795

layout(location = 0) out vec4 outMagn;
layout(location = 1) out vec4 outPhase;

void main() {
    vec3 x = texture(u_x, gl_FragCoord.xy / screenSize).xyz;
    vec3 y = texture(u_y, gl_FragCoord.xy / screenSize).xyz;

    vec3 phase = (atan(y, x) + vec3(PI)) / PI / 2.;
    vec3 magn = vec3(length(vec2(x.x, y.x)),  length(vec2(x.y, y.y)), length(vec2(x.z, y.z)));
    // vec3 logMagn = log(vec3(1.) + magn)/log(1. + u_maxval);

    outPhase = vec4(phase, 1.);
    outMagn = vec4(magn, 1.);
    return;
}