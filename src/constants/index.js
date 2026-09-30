/**
 * jmon/constants — the tables.
 *
 * Note names, scale intervals and interval names (`theory`), the
 * articulations and ornaments the performance functions know, and a way to
 * look through them: `list()`, `get(category)`, `describe(category, name)`,
 * `search(text)`.
 *
 * @license GPL-3.0-or-later
 */

import { MusicTheoryConstants, ARTICULATION_TYPES, ORNAMENT_TYPES, ConstantsAPI } from "../algorithms/constants/index.js";

export const theory = MusicTheoryConstants;
export const articulations = ARTICULATION_TYPES;
export const ornaments = ORNAMENT_TYPES;

export const list = ConstantsAPI.list.bind(ConstantsAPI);
export const get = ConstantsAPI.get.bind(ConstantsAPI);
export const describe = ConstantsAPI.describe.bind(ConstantsAPI);
export const search = ConstantsAPI.search.bind(ConstantsAPI);
export const listArticulations = ConstantsAPI.listArticulations.bind(ConstantsAPI);
export const listOrnaments = ConstantsAPI.listOrnaments.bind(ConstantsAPI);
export const listScales = ConstantsAPI.listScales.bind(ConstantsAPI);
export const listIntervals = ConstantsAPI.listIntervals.bind(ConstantsAPI);
