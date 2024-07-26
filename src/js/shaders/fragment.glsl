export default `

precision mediump float;
uniform float uTime;
uniform float uRadius;

float drawCircle(vec2 position, vec2 center, float radius);
float sdBox(in vec2 p, in vec2 b);

void fresnelShader();
void glowyLight();
void weirdCircle();
void gradient();
void gradient2();
void gradient3();

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    fresnelShader();
}

void fresnelShader() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = 1.0 - dot(viewDirection, vNormal);
    gl_FragColor = vec4(vec3(fresnel * 1., fresnel * 1. * 0.2, fresnel * 1.), 1);
}

void glowyLight() {
    float r = 1.0 - abs(vUv.x - 0.3);
    float g = 0.3;
    float b = 0.9;
    vec4 color = vec4(vec3(r,g,b), 1);
    gl_FragColor = color;
}


void weirdCircle() {
    const vec2 CENTER = vec2(0.5);
    float circleValue = drawCircle(vUv, CENTER, uRadius * 0.3);
    vec4 color = vec4(vec3(circleValue * 0.4, 0, circleValue*0.4), 1);
    gl_FragColor = color;
}

void gradient() {
    float smoothValue = 1. - sdBox(vUv-0.5, vec2(0.125));
    vec4 color = vec4(vec3(smoothValue * 0.4, 0, smoothValue * 0.4),1.);
    gl_FragColor = color;
}

void gradient2() {
    float r = vUv.x;
    float g = 0.0;
    float b = vUv.x;
    gl_FragColor = vec4(vec3(r,g,b), 1.);
}

void gradient3() {
    float r = (vUv.x - sin(uTime) * 0.8);
    float g = 0.0;
    float b = (vUv.x - cos(uTime) * 0.6);
    gl_FragColor = vec4(vec3(r,g,b), 1.);
}

float sdBox(in vec2 p, in vec2 b) {
    vec2 d= abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y), 0.0);
}

float drawCircle(vec2 position, vec2 center, float radius) {
    return step(radius, distance(position, center));
}
`