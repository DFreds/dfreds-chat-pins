import ChatPins from './chat-pins.js';

export default class ChatPinsLog extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'chat-pins',
      template: 'modules/dfreds-chat-pins/templates/chat-pins-app.html',
      title: 'Chat Pins Log',
      popOut: true,
      width: 300,
      height: 600,
      top: 400,
      left: 1300,
      minimizable: true,
      resizable: true,
      scrollY: ['#chat-pins-log'],
    });
  }

  constructor(options) {
    super(options);

    /**
     * Track the time when the last message was sent to avoid flooding notifications
     * @type {number}
     * @private
     */
    this._lastMessageTime = 0;

    /**
     * Track the id of the last message displayed in the log
     * @type {string|null}
     * @private
     */
    this._lastId = null;

    /**
     * Track the last received message which included the user as a whisper recipient.
     * @type {ChatMessage|null}
     * @private
     */
    this._lastWhisper = null;

    // Update timestamps every 15 seconds
    setInterval(this.updateTimestamps.bind(this), 1000 * 15);

    this._chatPins = new ChatPins();
  }

  /**
   * A reference to the Messages collection that the chat log displays
   * @type {Messages}
   */
  get collection() {
    return game.messages.filter((message) => this._chatPins.isPinned(message));
  }

  /** @inheritdoc */
  async _render(force, options) {
    if (this.rendered) return; // Never re-render the Chat Log itself, only it's contents
    await super._render(force, options);
    this.scrollBottom();
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _renderInner(data) {
    const html = await super._renderInner(data);
    await this._renderBatch(html, CONFIG.ChatMessage.batchSize);
    return html;
  }

  /* -------------------------------------------- */

  /**
   * Render a batch of additional messages, prepending them to the top of the log
   * @param {jQuery} html     The rendered jQuery HTML object
   * @param {number} size     The batch size to include
   * @return {Promise<void>}
   * @private
   */
  async _renderBatch(html, size) {
    const messages = this.collection;
    const log = html.find('#chat-pins-log');

    // Get the index of the last rendered message
    let lastIdx = messages.findIndex((m) => m.id === this._lastId);
    lastIdx = lastIdx !== -1 ? lastIdx : messages.length;

    // Get the next batch to render
    let targetIdx = Math.max(lastIdx - size, 0);
    let m = null;
    if (lastIdx !== 0) {
      let html = [];
      for (let i = targetIdx; i < lastIdx; i++) {
        m = messages[i];
        if (!m.visible) continue;
        m.logged = true;
        try {
          html.push(await m.getHTML());
        } catch (err) {
          err.message = `Chat message ${m.id} failed to render: ${err})`;
          console.error(err);
        }
      }

      // Prepend the HTML
      log.prepend(html);
      this._lastId = messages[targetIdx].id;
    }
  }

  /**
   * Trigger a notification that alerts the user visually and audibly that a new chat log message has been posted
   */
  notify(message) {
    this._lastMessageTime = Date.now();
    if (!this.rendered) return;

    // Display the chat notification icon and remove it 3 seconds later
    let icon = $('#chat-notification');
    if (icon.is(':hidden')) icon.fadeIn(100);
    setTimeout(() => {
      if (Date.now() - this._lastMessageTime > 3000 && icon.is(':visible'))
        icon.fadeOut(100);
    }, 3001);

    // Play a notification sound effect
    if (message.data.sound) AudioHelper.play({ src: message.data.sound });
  }

  /**
   * Scroll the chat log to the bottom
   * @param {object} options
   * @param {boolean} options.popout If a popout exists, scroll it too
   * @private
   */
  scrollBottom() {
    const el = this.element;
    const log = el.length ? el[0].querySelector('#chat-pins-log') : null;
    if (log) log.scrollTop = log.scrollHeight;
  }

  /**
   * Update the displayed timestamps for every displayed message in the chat log.
   * Timestamps are displayed in a humanized "timesince" format.
   */
  updateTimestamps() {
    const messages = this.element.find('#chat-pins-log .message');
    for (let li of messages) {
      const message = game.messages.get(li.dataset['messageId']);
      if (!message?.data.timestamp) return;
      const stamp = li.querySelector('.message-timestamp');
      stamp.textContent = foundry.utils.timeSince(message.data.timestamp);
    }
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers
  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    // Load new messages on scroll
    html.find('#chat-pins-log').scroll(this._onScrollLog.bind(this));

    // Single Message Delete
    html.on('click', 'a.message-delete', this._onDeleteMessage.bind(this));

    // Chat Entry context menu
    this._contextMenu(html);
  }

  _contextMenu(html) {
    ContextMenu.create(this, html, '.message', this._getEntryContextOptions());
  }

  _getEntryContextOptions() {
    return [
      {
        name: 'Jump to Pin',
        icon: '<i class="fas fa-bullseye"></i>',
        callback: (li) => {
          const messageId = li.data('messageId');
          const $message = $(
            `#chat-log .chat-message[data-message-id="${messageId}"]`
          );
          $message.get(0).scrollIntoView({
            behavior: 'smooth',
          });
        },
      },
      {
        name: 'Unpin Message',
        icon: '<i class="fas fa-thumbtack"></i>',
        condition: (li) => {
          const message = game.messages.get(li.data('messageId'));
          return game.user.isGM && this._chatPins.isPinned(message);
        },
        callback: async (li) => {
          const message = game.messages.get(li.data('messageId'));
          await this._chatPins.unpin(message);
          await this._renderInner();
        },
      },
      ...ChatLog.prototype._getEntryContextOptions(),
    ];
  }

  /**
   * Handle single message deletion workflow
   * @param {Event} event
   * @private
   */
  _onDeleteMessage(event) {
    event.preventDefault();
    const li = event.currentTarget.closest('.message');
    const message = game.messages.get(li.dataset.messageId);
    return message.delete();
  }

  /**
   * Handle scroll events within the chat log container
   *
   * @param {UIEvent} event   The initial scroll event
   * @private
   */
  _onScrollLog(event) {
    if (!this.rendered) return;
    const log = event.target;
    const pct = log.scrollTop / log.scrollHeight;
    if (pct < 0.01) {
      return this._renderBatch(this.element, CONFIG.ChatMessage.batchSize);
    }
  }
}
