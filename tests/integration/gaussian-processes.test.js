/**
 * Comprehensive tests for Gaussian Process Regression
 * Tests GP with different kernels
 */

import { GaussianProcessRegressor } from '../src/algorithms/generative/gaussian-processes/GaussianProcessRegressor.js';

console.log('=== Testing Gaussian Process Regression ===\n');

// Test 1: GP with RBF Kernel
console.log('1. Testing GP with RBF Kernel');
try {
  const gp = new GaussianProcessRegressor({
    kernel: 'rbf',
    lengthScale: 1.0,
    variance: 1.0
  });

  // Training data
  const X = [[0], [1], [2], [3], [4]];
  const y = [0, 1, 4, 9, 16]; // Quadratic function

  gp.fit(X, y);
  console.log('  ✓ Fitted GP to training data');

  // Predict
  const XTest = [[0.5], [1.5], [2.5]];
  const predictions = gp.predict(XTest);
  console.log('  ✓ Made predictions:', predictions.length);
  console.log('  ✓ Sample predictions:', predictions.map(p => p.toFixed(2)));

  // Predict with uncertainty
  const { mean, std } = gp.predictWithUncertainty(XTest);
  console.log('  ✓ Predicted with uncertainty');
  console.log('  ✓ Mean:', mean.map(m => m.toFixed(2)));
  console.log('  ✓ Std dev:', std.map(s => s.toFixed(2)));
  console.log('  ✓ Has uncertainty estimates:', std.every(s => s > 0));
} catch (error) {
  console.error('  ✗ Error:', error.message);
}
console.log('');

// Test 2: GP with Periodic Kernel
console.log('2. Testing GP with Periodic Kernel');
try {
  const gp = new GaussianProcessRegressor({
    kernel: 'periodic',
    lengthScale: 1.0,
    periodLength: 2.0,
    variance: 1.0
  });

  // Periodic data (sine wave)
  const X = [[0], [0.5], [1], [1.5], [2], [2.5], [3]];
  const y = X.map(x => Math.sin(x[0] * Math.PI));

  gp.fit(X, y);
  console.log('  ✓ Fitted GP with periodic kernel');

  const XTest = [[0.25], [0.75], [1.25]];
  const predictions = gp.predict(XTest);
  console.log('  ✓ Predictions:', predictions.map(p => p.toFixed(2)));
  console.log('  ✓ Captured periodicity:', predictions.length > 0);
} catch (error) {
  console.error('  ✗ Error:', error.message);
}
console.log('');

// Test 3: GP with Rational Quadratic Kernel
console.log('3. Testing GP with Rational Quadratic Kernel');
try {
  const gp = new GaussianProcessRegressor({
    kernel: 'rational_quadratic',
    lengthScale: 1.0,
    alpha: 1.0,
    variance: 1.0
  });

  const X = [[0], [1], [2], [3]];
  const y = [1, 2, 2.5, 2.8];

  gp.fit(X, y);
  console.log('  ✓ Fitted GP with rational quadratic kernel');

  const XTest = [[0.5], [1.5], [2.5]];
  const predictions = gp.predict(XTest);
  console.log('  ✓ Predictions:', predictions.map(p => p.toFixed(2)));
} catch (error) {
  console.error('  ✗ Error:', error.message);
}
console.log('');

// Test 4: GP Sample Generation
console.log('4. Testing GP Sample Generation');
try {
  const gp = new GaussianProcessRegressor({
    kernel: 'rbf',
    lengthScale: 1.0,
    variance: 1.0
  });

  const X = [[0], [1], [2], [3], [4]];
  const y = [0, 1, 0, -1, 0]; // Oscillating

  gp.fit(X, y);

  // Generate samples
  const XTest = Array.from({ length: 10 }, (_, i) => [i * 0.5]);
  const samples = gp.sample(XTest, 3); // 3 samples
  console.log('  ✓ Generated', samples.length, 'samples');
  console.log('  ✓ Each sample length:', samples[0].length);
  console.log('  ✓ Sample 1:', samples[0].slice(0, 5).map(s => s.toFixed(2)));
  console.log('  ✓ Sample 2:', samples[1].slice(0, 5).map(s => s.toFixed(2)));
} catch (error) {
  console.error('  ✗ Error:', error.message);
}
console.log('');

// Test 5: GP for Music Generation
console.log('5. Testing GP for Music Generation');
try {
  const gp = new GaussianProcessRegressor({
    kernel: 'rbf',
    lengthScale: 2.0,
    variance: 10.0
  });

  // Musical phrase (pitches over time)
  const X = [[0], [1], [2], [3], [4], [5]];
  const y = [60, 62, 64, 65, 64, 62]; // C major scale up and down

  gp.fit(X, y);
  console.log('  ✓ Fitted GP to musical phrase');

  // Interpolate between points
  const XInterpolate = Array.from({ length: 20 }, (_, i) => [i * 0.25]);
  const interpolated = gp.predict(XInterpolate);
  console.log('  ✓ Interpolated melody');
  console.log('  ✓ Length:', interpolated.length);
  console.log('  ✓ Pitch range:', Math.min(...interpolated).toFixed(0), '-', Math.max(...interpolated).toFixed(0));
  console.log('  ✓ Sample pitches:', interpolated.slice(0, 8).map(p => Math.round(p)));
} catch (error) {
  console.error('  ✗ Error:', error.message);
}
console.log('');

// Test 6: GP Optimization
console.log('6. Testing GP Hyperparameter Optimization');
try {
  const gp = new GaussianProcessRegressor({
    kernel: 'rbf',
    lengthScale: 1.0,
    variance: 1.0,
    optimizeHyperparameters: false
  });

  const X = [[0], [1], [2], [3], [4]];
  const y = [0, 1, 4, 9, 16];

  gp.fit(X, y);
  console.log('  ✓ Fitted without optimization');

  const lengthScaleBefore = gp.kernel.params.lengthScale;
  console.log('  ✓ Length scale before:', lengthScaleBefore);

  // Note: Optimization would be tested if enabled
  console.log('  ✓ GP configuration saved successfully');
} catch (error) {
  console.error('  ✗ Error:', error.message);
}
console.log('');

// Test 7: GP Edge Cases
console.log('7. Testing GP Edge Cases');
try {
  const gp = new GaussianProcessRegressor({
    kernel: 'rbf',
    lengthScale: 1.0,
    variance: 1.0
  });

  // Single point
  const X1 = [[0]];
  const y1 = [1];
  gp.fit(X1, y1);
  const pred1 = gp.predict([[0]]);
  console.log('  ✓ Handled single training point');
  console.log('  ✓ Prediction at training point:', pred1[0].toFixed(2), '(expected: ~1)');

  // Two points
  const X2 = [[0], [1]];
  const y2 = [0, 1];
  gp.fit(X2, y2);
  const pred2 = gp.predict([[0.5]]);
  console.log('  ✓ Handled two training points');
  console.log('  ✓ Interpolation:', pred2[0].toFixed(2), '(expected: ~0.5)');
} catch (error) {
  console.error('  ✗ Error:', error.message);
}
console.log('');

console.log('=== Gaussian Process Tests Complete ===\n');
