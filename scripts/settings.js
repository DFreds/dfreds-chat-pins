import Constants from './constants.js';

/**
 * Handle setting and fetching all settings in the module
 */
export default class Settings {
  // Settings keys
  static PIN_PERMISSION = 'pinPermission';

  /**
   * Register all settings for the module
   */
  registerSettings() {
    const userRoles = {};
    userRoles[CONST.USER_ROLES.PLAYER] = 'Player';
    userRoles[CONST.USER_ROLES.TRUSTED] = 'Trusted Player';
    userRoles[CONST.USER_ROLES.ASSISTANT] = 'Assistant GM';
    userRoles[CONST.USER_ROLES.GAMEMASTER] = 'Game Master';
    // userRoles[5] = 'None';

    game.settings.register(Constants.MODULE_ID, Settings.PIN_PERMISSION, {
      name: 'Pin Permission',
      hint: 'This defines the minimum permission level to be able to pin a chat message.',
      scope: 'world',
      config: true,
      default: CONST.USER_ROLES.TRUSTED,
      choices: userRoles,
      type: String,
    });
  }

  /**
   * Returns the game setting for pin permission
   *
   * @returns {number} a number representing the chosen role
   */
  get pinPermission() {
    return parseInt(
      game.settings.get(Constants.MODULE_ID, Settings.PIN_PERMISSION)
    );
  }
}
