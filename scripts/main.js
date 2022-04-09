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
  libWrapper.register(
    Constants.MODULE_ID,
    'Messages.prototype.flush',
    function (wrapper, ...args) {
      const chatPins = new ChatPins();
      chatPins.deleteAllExceptPins(this.documentClass);
    },
    'OVERRIDE'
  );
});

// TODO add pin button in top right of message?
// TODO indicate that a message is pinned somehow

Hooks.on('renderChatLog', (_chatLogApp, $html, _data) => {
  const controlButtons = $html.find('#chat-controls .control-buttons');
  controlButtons.css('flex', '0 0 72px');
  controlButtons.prepend(
    `<a class="chat-pins" title="Chat Pins"><i class=" fas fa-thumbtack"></i></a>`
  );
  // TODO on click, open chat log app with only pins
});

Hooks.on('renderChatMessage', (chatMessage, $html, data) => {
  const isPinned = chatMessage.getFlag(Constants.MODULE_ID, 'pinned');

  if (isPinned) {
    $html.css('border', '2px solid #ff6400');
  } else {
    $html.css('border', '');
  }
});

Hooks.on('getChatLogEntryContext', (_chatLogApp, entries) => {
  entries.unshift(
    {
      name: 'Pin Message',
      icon: '<i class="fas fa-thumbtack"></i>',
      condition: (li) => {
        // TODO check setting permission
        const message = game.messages.get(li.data('messageId'));
        return !message.getFlag(Constants.MODULE_ID, 'pinned');
      },
      callback: (li) => {
        const message = game.messages.get(li.data('messageId'));
        return message.setFlag(Constants.MODULE_ID, 'pinned', game.user.name);
      },
    },
    {
      name: 'Unpin Message',
      icon: '<i class="fas fa-thumbtack"></i>',
      condition: (li) => {
        // TODO check setting permission
        const message = game.messages.get(li.data('messageId'));
        return message.getFlag(Constants.MODULE_ID, 'pinned');
      },
      callback: (li) => {
        const message = game.messages.get(li.data('messageId'));
        return message.unsetFlag(Constants.MODULE_ID, 'pinned');
      },
    }
  );
});
