#version 300 es

precision mediump float;
uniform sampler2D u_magn;
uniform sampler2D u_phase;

uniform vec2 screenSize;

uniform float u_direction;
uniform int u_normalise;
uniform int u_mode;
uniform float u_maxval;

#define PI 3.1415926535897932384626433832795

out vec4 outColor;


vec2 CMul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y,  a.x * b.y + a.y * b.x);
}

float CPhase(vec2 c) {
    return (atan(c.y, c.x) + PI) / PI / 2.;
}

vec2 CExp(vec2 c) {
    float coef = exp(c.x);
    return vec2(coef * cos(c.y), coef * sin(c.y));
}

vec2 getValue(float i, float j, int chan) {
    float logmagn = texture(u_magn, vec2(i+0.5, j+0.5) / screenSize)[chan];
    float phase_corrected = texture(u_phase, vec2(i+0.5, j+0.5) / screenSize)[chan];

    float magn  = exp(logmagn * log(1. + u_maxval)) - 1.;
    float phase = phase_corrected*2.*PI - PI;

    return vec2(magn * cos(phase), magn*sin(phase));
}

void main() {

    // vec4 m = texture(u_magn, gl_FragCoord.xy / screenSize);
    // vec4 p = texture(u_phase, gl_FragCoord.xy / screenSize);
    // outColor = (m+p)/2.;

    vec2 resR = vec2(0., 0.);
    vec2 resG = vec2(0., 0.);
    vec2 resB = vec2(0., 0.);

    float k = gl_FragCoord.x - 0.5;
    float l = gl_FragCoord.y - 0.5;

    float N = screenSize.x;
    float M = screenSize.y;

    
    // float r  = getValue(k,l,0).x;
    // float g  = getValue(k,l,1).x;
    // float b  = getValue(k,l,2).x;
    // outColor = vec4(r, g, b, 1.);

    for(int ii = 0; ii < int(N); ii++) {
        for(int jj = 0; jj < int(M); jj++) {
            float i = float(ii);
            float j = float(jj);
            vec2 power = vec2(0., u_direction * 2. * PI * (k*i/N + l*j/M));
            vec2 mul = CExp(power);

            resR += CMul(getValue(i,j,0), mul);
            resG += CMul(getValue(i,j,1), mul);
            resB += CMul(getValue(i,j,2), mul);
        }
    }

    if (u_normalise != 0) {
        resR = resR / N / M;
        resG = resG / N / M;
        resB = resB / N / M;
    }

    outColor = vec4(resR.x, resG.x, resB.x, 1.);
    return;
}