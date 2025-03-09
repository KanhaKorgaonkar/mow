// Grass vertex shader for realistic grass swaying
export const grassVertexShader = `
uniform float time;
uniform float windStrength;
uniform float mowedHeight;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normal;
  
  // Get instance matrix data
  mat4 instanceMatrix = instanceMatrix;
  
  // Extract scale from instance matrix to determine if grass is mowed
  float scaleY = length(vec3(instanceMatrix[1].x, instanceMatrix[1].y, instanceMatrix[1].z));
  
  // Apply wind effect (only to the top of grass blades and only if not mowed)
  vec3 pos = position;
  
  if (scaleY > 0.3 && position.y > 0.1) {
    // Wind strength increases with height
    float windFactor = (position.y / 0.3) * windStrength;
    
    // Wind movement based on position and time
    float windX = sin(time * 2.0 + position.x * 10.0 + position.z * 10.0) * windFactor;
    float windZ = cos(time * 2.0 + position.x * 10.0 + position.z * 10.0) * windFactor;
    
    pos.x += windX;
    pos.z += windZ;
  }
  
  // Apply instance transformation
  vec4 worldPosition = instanceMatrix * vec4(pos, 1.0);
  
  // Project to screen
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
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
