import ds from "@tangent.to/ds";

const _GPR = ds.ml.GaussianProcessRegressor;

/**
 * Gaussian Process Regressor — thin wrapper around @tangent.to/ds
 * that adds the `predictWithUncertainty` convenience method and
 * `isFitted` property used elsewhere in jmon/algo.
 */
export class GaussianProcessRegressor extends _GPR {
  constructor(options) {
    super(options);
    this._isFitted = false;
  }

  /**
   * Whether the model has been fitted.
   * @type {boolean}
   */
  get isFitted() {
    return this._isFitted;
  }

  /**
   * Fit the model to training data.
   * @param {Array<Array<number>>} X - Training inputs
   * @param {Array<number>} y - Training outputs
   */
  fit(X, y) {
    super.fit(X, y);
    this._isFitted = true;
  }

  /**
   * Predict with uncertainty estimates.
   * @param {Array<Array<number>>} X - Input points
   * @returns {{ mean: Array<number>, std: Array<number> }}
   */
  predictWithUncertainty(X) {
    return this.predict(X, { returnStd: true });
  }
}
