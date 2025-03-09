// Simplified grass vertex shader
export const grassVertexShader = `
uniform float time;
uniform float windStrength;
uniform float mowedHeight;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normal;
  
  // Basic wind effect
  vec3 pos = position;
  
  // Simple wave effect on top portion of grass
  if (position.y > 0.1) {
    float windFactor = position.y * windStrength;
    pos.x += sin(time * 2.0 + position.z * 10.0) * windFactor;
  }
  
  // Apply instance transformation and projection
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
}
`;

// Grass fragment shader for realistic grass color
export const grassFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  // Base color gradient from bottom to top
  vec3 baseColor = mix(
    vec3(0.06, 0.28, 0.08), // Darker green at bottom
    vec3(0.15, 0.55, 0.15), // Lighter green at top
    vUv.y
  );
  
  // Add some variation based on position
  float variation = fract(sin(vUv.x * 100.0) * 1000.0) * 0.1 - 0.05;
  baseColor += vec3(variation);
  
  // Add lighting based on normal
  float lightIntensity = max(0.5, dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))));
  vec3 litColor = baseColor * lightIntensity;
  
  gl_FragColor = vec4(litColor, 1.0);
}
`;

// More shaders can be added for other effects
