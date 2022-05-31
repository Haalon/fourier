#version 300 es

precision mediump float;
uniform sampler2D u_texture;
uniform vec2 screenSize;

uniform float u_direction;
uniform int u_normalise;
uniform int u_mode;

#define PI 3.1415926535897932384626433832795

out vec4 outColor;

vec2 CMul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y,  a.x * b.y + a.y * b.x);
}

float CPhase(vec2 c) {
    return atan(c.y, c.x);
}

vec2 CExp(vec2 c) {
    float coef = exp(c.x);
    return vec2(coef * cos(c.y), coef * sin(c.y));
} 

void main() {
    vec2 resR = vec2(0., 0.);
    vec2 resG = vec2(0., 0.);
    vec2 resB = vec2(0., 0.);

    float k = gl_FragCoord.x - 0.5;
    float l = gl_FragCoord.y - 0.5;

    float N = screenSize.x;
    float M = screenSize.y;

    

    for(float i = 0.; i < N; i++) {
        for(float j = 0.; j < M; j++) {
            vec2 power = vec2(0., u_direction * 2. * PI * (k*i/N + l*j/M));
            vec4 term = texture(u_texture, gl_FragCoord.xy / screenSize);

            resR += CMul(vec2(term.r, 0.), CExp(power));
            resG += CMul(vec2(term.g, 0.), CExp(power));
            resB += CMul(vec2(term.b, 0.), CExp(power));
        }
    }

    if (u_normalise != 0) {
        resR /= N*M;
        resG /= N*M;
        resB /= N*M;
    }

    if (u_mode != 0) outColor = vec4(length(resR), length(resG), length(resB), 1.);
    else outColor = vec4(CPhase(resR), CPhase(resG), CPhase(resB), 1.);
    return;
}