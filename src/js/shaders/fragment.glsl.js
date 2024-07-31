export default `

precision mediump float;
uniform float uTime;

varying vec2 vUv;

void main() {
    float r = (vUv.x - sin(uTime) * 0.8);
    float g = 0.0;
    float b = (vUv.x - cos(uTime) * 0.6);
    gl_FragColor = vec4(vec3(r,g,b), 1.);
}
`