import Constants from './constants.js';
import Settings from './settings.js';

/**
 * Handles setting up all handlebar helpers
 */
export default class HandlebarHelpers {
  constructor() {
    this._settings = new Settings();
  }

  /**
   * Registers the handlebar helpers
   */
  registerHelpers() {
    // this._registerCanShowDisabledEffectsHelper();
  }

  // _registerCanShowDisabledEffectsHelper() {
  //   Handlebars.registerHelper('canShowDisabledEffects', () => {
  //     return this._settings.showDisabledEffects;
  //   });
  // }
}
