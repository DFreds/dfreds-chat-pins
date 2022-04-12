import HandlebarHelpers from './handlebar-helpers.js';
import { libWrapper } from './lib/shim.js';
import Constants from './constants.js';
import Settings from './settings.js';
import ChatPins from './chat-pins.js';

/**
 * Initializes the handlebar helpers
 */
Hooks.once('init', () => {
  new Settings().registerSettings();
  new HandlebarHelpers().registerHelpers();

  game.dfreds = game.dfreds || {};
});

/**
 * Handle setting up the app and lib wrapper overrides
 */
Hooks.once('ready', () => {
  /**
   * Overrides the standard flush so that pinned messages are not deleted
   */
  libWrapper.register(
    Constants.MODULE_ID,
    'Messages.prototype.flush',
    function (_wrapper, ..._args) {
      const chatPins = new ChatPins();
      chatPins.deleteAllExceptPins(this.documentClass);
    },
    'OVERRIDE'
  );
});

// TODO add pin button in top right of message?

/**
 * Handle adding pin button to chat buttons
 */
Hooks.on('renderChatLog', (_chatLogApp, $html, _data) => {
  const chatPins = new ChatPins();
  chatPins.addPinButton($html);
});

/**
 * Handle modifying chat message when rendered to indicate pin status
 */
Hooks.on('renderChatMessage', (message, $html, _data) => {
  const chatPins = new ChatPins();

  if (chatPins.isPinned(message)) {
    $html.css('border', '2px solid #ff6400');
    $html
      .find('.message-header .message-sender')
      .append(
        `<h4 style="font-size: 12px;">Pinned by ${chatPins.pinner(
          message
        )}</h4>`
      );
  } else {
    $html.css('border', '');
  }
});

/**
 * Add new context menu operations to the chat log entries
 */
Hooks.on('getChatLogEntryContext', (_chatLogApp, entries) => {
  const chatPins = new ChatPins();

  entries.unshift(
    {
      name: 'Pin Message',
      icon: '<i class="fas fa-thumbtack"></i>',
      condition: (li) => {
        const message = game.messages.get(li.data('messageId'));
        return game.user.isGM && !chatPins.isPinned(message);
      },
      callback: async (li) => {
        const message = game.messages.get(li.data('messageId'));
        await chatPins.pin(message);
      },
    },
    {
      name: 'Unpin Message',
      icon: '<i class="fas fa-thumbtack"></i>',
      condition: (li) => {
        const message = game.messages.get(li.data('messageId'));
        return game.user.isGM && chatPins.isPinned(message);
      },
      callback: async (li) => {
        const message = game.messages.get(li.data('messageId'));
        await chatPins.unpin(message);
      },
    }
  );
});
