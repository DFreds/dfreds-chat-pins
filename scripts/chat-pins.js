import ChatPinsApp from './app/chat-pins-app.js';
import Constants from './constants.js';
import Settings from './settings.js';

/**
 * Handles all logic around pinning chat messages
 */
export default class ChatPins {
  static FLAG = 'pinned';

  constructor() {
    this._settings = new Settings();
  }

  addPinButton($chatHtml) {
    const pinButton = $(
      '<a class="chat-pins" title=""><i class="fas fa-thumbtack"></i></a>'
    );
    // TODO open just pins
    // pinButton.click(() => {
    //   new ChatPinsApp().render(true);
    // });
    const controlButtons = $chatHtml.find('#chat-controls .control-buttons');
    controlButtons.css('flex', '0 0 72px');
    controlButtons.prepend(pinButton);
  }

  /**
   * Check if a user is allowed to pin or unpin a message
   *
   * @returns {boolean} true if the user is has permission to manipulate pins
   */
  canPin() {
    return game.user.role >= this._settings.pinPermission;
  }

  /**
   * Checks if a given message is pinned
   *
   * @param {ChatMessage} message - the message to check if pinned
   * @returns {boolean} true if the message is pinned
   */
  isPinned(message) {
    return message.getFlag(Constants.MODULE_ID, ChatPins.FLAG) !== undefined;
  }

  /**
   * Pins the given message
   *
   * @param {ChatMessage} message - the message to pin
   */
  pin(message) {
    message.setFlag(Constants.MODULE_ID, ChatPins.FLAG, game.user.id);
  }

  /**
   * Unpins the given message
   *
   * @param {ChatMessage} message - the message to unpin
   */
  unpin(message) {
    message.unsetFlag(Constants.MODULE_ID, ChatPins.FLAG);
  }

  /**
   * Get the user who pinned the message
   *
   * @param {ChatMessage} message - the message to get the pinner of
   * @returns {string} the name of the user who pinned the message
   */
  pinner(message) {
    const pinnerId = message.getFlag(Constants.MODULE_ID, ChatPins.FLAG);
    return game.users.get(pinnerId).name;
  }

  // TODO do your own i18n
  /**
   * Prompts to delete all messages from the chat log except pins
   *
   * @param {Class} documentClass - the class representing the chat message documents
   * @returns {Promise} a promise that resolves when the dialog is finished
   */
  deleteAllExceptPins(documentClass) {
    return Dialog.confirm({
      title: game.i18n.localize('CHAT.FlushTitle'),
      content: `<h4>${game.i18n.localize(
        'AreYouSure'
      )}</h4><p>${game.i18n.localize(
        'CHAT.FlushWarning'
      )}</p><p>Note that this will not delete any pinned messages.</p>`,
      yes: () => {
        const notPinnedIds = game.messages
          .filter((message) => !message.getFlag('dfreds-chat-pins', 'pinned'))
          .map((message) => message.id);

        documentClass.deleteDocuments(notPinnedIds);
      },
      options: {
        top: window.innerHeight - 175,
        left: window.innerWidth - 720,
      },
    });
  }
}
