import ds from "@tangent.to/ds";

const _GPR = ds.ml.GaussianProcessRegressor;

/**
 * Gaussian Process Regressor — thin wrapper around @tangent.to/ds
 * that adds the `predictWithUncertainty` convenience method used
 * elsewhere in jmon/algo.
 */
export class GaussianProcessRegressor extends _GPR {
  /**
   * Predict with uncertainty estimates.
   * @param {Array<Array<number>>} X - Input points
   * @returns {{ mean: Array<number>, std: Array<number> }}
   */
  predictWithUncertainty(X) {
    return this.predict(X, { returnStd: true });
  }
}
