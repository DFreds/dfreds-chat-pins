import Constants from './constants.js';

/**
 * Handle setting and fetching all settings in the module
 */
export default class Settings {
  // Settings keys
  // static VIEW_PERMISSION = 'viewPermission';

  /**
   * Register all settings for the module
   */
  registerSettings() {
    const userRoles = {};
    userRoles[CONST.USER_ROLES.PLAYER] = 'Player';
    userRoles[CONST.USER_ROLES.TRUSTED] = 'Trusted Player';
    userRoles[CONST.USER_ROLES.ASSISTANT] = 'Assistant GM';
    userRoles[CONST.USER_ROLES.GAMEMASTER] = 'Game Master';
    userRoles[5] = 'None';

    // game.settings.register(Constants.MODULE_ID, Settings.VIEW_PERMISSION, {
    //   name: 'View Permission',
    //   hint: 'This defines the minimum permission level to see the effects panel. Setting this to None will never show the effects panel.',
    //   scope: 'world',
    //   config: true,
    //   default: CONST.USER_ROLES.GAMEMASTER,
    //   choices: userRoles,
    //   type: String,
    //   onChange: () => game.dfreds.effectsPanel.refresh(),
    // });
  }

  /**
   * Returns the game setting for view permission
   *
   * @returns {number} a number representing the chosen role
   */
  // get viewPermission() {
  //   return parseInt(
  //     game.settings.get(Constants.MODULE_ID, Settings.VIEW_PERMISSION)
  //   );
  // }
}
