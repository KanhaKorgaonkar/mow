// Enhanced grass vertex shader for more realistic movement
export const grassVertexShader = `
uniform float time;
uniform float windStrength;
uniform float mowedHeight;

attribute float grassState; // 0 = not mowed, 1 = mowed
attribute vec3 instanceColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vColor;
varying float vGrassState;
varying float vHeight;

// Noise functions
float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

float noise(vec3 x) {
  // The noise function returns a value in the range -1.0 -> 1.0
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  
  float n = p.x + p.y * 57.0 + 113.0 * p.z;
  return mix(
    mix(
      mix(hash(n + 0.0), hash(n + 1.0), f.x),
      mix(hash(n + 57.0), hash(n + 58.0), f.x),
      f.y),
    mix(
      mix(hash(n + 113.0), hash(n + 114.0), f.x),
      mix(hash(n + 170.0), hash(n + 171.0), f.x),
      f.y),
    f.z);
}

void main() {
  vUv = uv;
  vNormal = normal;
  vColor = instanceColor;
  vGrassState = grassState;
  vHeight = position.y;
  
  // Get instance position for unique wind effects
  vec4 instancePos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float uniqueOffset = instancePos.x * 0.01 + instancePos.z * 0.01;
  
  // Modify position based on grassState (if mowed, lower height)
  vec3 pos = position;
  
  // If mowed, reduce the height dramatically
  if (grassState > 0.5) {
    pos.y *= 0.2; // Mowed grass is 20% of original height
  } else {
    // Apply complex wind effect only to non-mowed grass
    if (position.y > 0.1) {
      // Wind intensity increases with height
      float windFactor = position.y * windStrength;
      
      // Primary wind wave
      float mainWind = sin(time * 1.5 + instancePos.x * 0.5 + instancePos.z * 0.5) * windFactor;
      
      // Secondary wind waves - these add complexity to the animation
      float noise1 = noise(vec3(instancePos.x * 0.1, time * 0.2, instancePos.z * 0.1)) * windFactor * 0.5;
      float noise2 = noise(vec3(instancePos.z * 0.1, instancePos.x * 0.1, time * 0.3)) * windFactor * 0.25;
      
      // Combine different wave types for more natural movement
      pos.x += mainWind + noise1;
      pos.z += noise2;
      
      // Slight bend at the top for more natural appearance
      if (position.y > 0.6) {
        float bendFactor = (position.y - 0.6) * 0.3;
        pos.x += bendFactor * sin(time * 0.5 + uniqueOffset * 10.0);
        pos.z += bendFactor * cos(time * 0.5 + uniqueOffset * 10.0);
      }
    }
  }
  
  // Apply instance transformation and projection
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
}
`;

// Enhanced grass fragment shader for more realistic coloring
export const grassFragmentShader = `
uniform float time;
uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform vec3 ambientColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vColor;
varying float vGrassState;
varying float vHeight;

void main() {
  // Adjust color based on grass state (mowed or not)
  vec3 baseColor;
  
  if (vGrassState > 0.5) {
    // Mowed grass - more yellowish/brownish
    baseColor = mix(
      vec3(0.35, 0.32, 0.15), // Brown at bottom
      vec3(0.55, 0.55, 0.2),  // Yellow-green at top
      vUv.y
    );
  } else {
    // Regular grass - gradient from dark to light green
    baseColor = mix(
      vec3(0.05, 0.23, 0.06), // Darker green at bottom
      vec3(0.17, 0.6, 0.17),  // Lighter green at top
      pow(vUv.y, 1.5)         // Non-linear gradient for more natural look
    );
    
    // Add yellow/brown tips at the very top for more realism
    if (vHeight > 0.8) {
      float tipFactor = (vHeight - 0.8) * 5.0; // 0 to 1 for the top 20%
      baseColor = mix(baseColor, vec3(0.7, 0.6, 0.2), tipFactor * 0.3);
    }
  }
  
  // Add subtle random variation to each grass blade
  float variation = fract(sin(vColor.x * 100.0 + vColor.z * 100.0) * 1000.0) * 0.15 - 0.075;
  baseColor += vec3(variation, variation * 1.5, variation * 0.5);
  
  // Enhanced lighting calculation
  vec3 normal = normalize(vNormal);
  float diffuse = max(0.3, dot(normal, normalize(sunDirection)));
  vec3 diffuseLight = sunColor * diffuse;
  
  // Combine direct light and ambient light
  vec3 litColor = baseColor * (diffuseLight + ambientColor);
  
  // Add slight shadow at the bottom
  litColor *= mix(0.7, 1.0, vUv.y);
  
  // Add slight shimmer effect on grass blades over time
  float shimmer = sin(time * 3.0 + vColor.x * 10.0 + vColor.z * 10.0) * 0.05;
  litColor += vec3(shimmer);
  
  gl_FragColor = vec4(litColor, 1.0);
}
`;

// Additional shader for sky
export const skyVertexShader = `
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const skyFragmentShader = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;

varying vec3 vWorldPosition;

void main() {
  float h = normalize(vWorldPosition + offset).y;
  gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
}
`;
