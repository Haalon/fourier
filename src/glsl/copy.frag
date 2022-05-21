precision mediump float;
uniform sampler2D texture;
uniform vec2 screenSize;
uniform vec2 u_offset;

void main() {
    gl_FragColor = texture2D(texture, (gl_FragCoord.xy + u_offset) / screenSize);
}