import ChatPins from "./chat-pins.js";

export default class ChatPinsLog extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "chat-pins",
            template: "modules/dfreds-chat-pins/templates/chat-pins-app.html",
            title: "Chat Pins Log",
            popOut: true,
            width: 300,
            height: 600,
            top: 400,
            left: 1300,
            minimizable: true,
            resizable: true,
            scrollY: ["#chat-log"],
        });
    }

    constructor(options) {
        super(options);

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
        setInterval(this._updateTimestamps.bind(this), 1000 * 15);

        this._chatPins = new ChatPins();
    }

    /**
     * A reference to the pinned Messages collection that the chat log displays
     * @type {Messages}
     */
    get collection() {
        return game.messages.filter((message) =>
            this._chatPins.isPinned(message),
        );
    }

    async _render(force, options) {
        if (this.rendered) return; // Never re-render the Chat Log itself, only it's contents
        await super._render(force, options);
        return this._scrollBottom();
    }

    /** @inheritdoc */
    async _renderInner(data) {
        const html = await super._renderInner(data);
        await this._renderBatch(html, CONFIG.ChatMessage.batchSize);
        return html;
    }

    async _renderBatch(html, size) {
        const messages = this.collection;
        const log = html.find("#chat-log");

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
     * Delete a single message from the chat log
     * @param {string} messageId    The ChatMessage document to remove from the log
     * @param {boolean} [deleteAll] Is this part of a flush operation to delete all messages?
     */
    deleteMessage(messageId, { deleteAll = false } = {}) {
        // Get the chat message being removed from the log
        const message = game.messages.get(messageId, { strict: false });
        if (message) message.logged = false;

        // Get the current HTML element for the message
        let li = this.element.find(`.message[data-message-id="${messageId}"]`);
        if (!li.length) return;

        // Update the last index
        if (deleteAll) {
            this._lastId = null;
        } else if (messageId === this._lastId) {
            const next = li[0].nextElementSibling;
            this._lastId = !!next ? next.dataset["messageId"] : null;
        }

        // Remove the deleted message
        li.slideUp(100, () => li.remove());
    }

    /**
     * Post a single chat message to the log
     * @param {ChatMessage} message   A ChatMessage document instance to post to the log
     * @param {boolean} [notify]      Trigger a notification which shows the log as having a new unread message
     * @param {object} [options={}]   Additional options for how the message is posted to the log
     * @param {string} [options.before] An existing message ID to append the message before, by default the new message is
     *                                  appended to the end of the log.
     * @return {Promise<void>}        A Promise which resolves once the message is posted
     */
    async postOne(message, notify = false, { before } = {}) {
        if (!message.visible) return;
        message.logged = true;

        // Track internal flags
        if (!this._lastId) this._lastId = message.id; // Ensure that new messages don't result in batched scrolling
        if ((message.whisper || []).includes(game.user.id) && !message.isRoll) {
            this._lastWhisper = message;
        }

        // Render the message to the log
        const html = await message.getHTML();
        const log = this.element.find("#chat-log");

        // Append the message after some other one
        const existing = before
            ? this.element.find(`.message[data-message-id="${before}"]`)
            : [];
        if (existing.length) existing.before(html);
        // Otherwise, append the message to the bottom of the log
        else {
            log.append(html);
            this._scrollBottom();
        }
    }

    _scrollBottom() {
        const el = this.element;
        const log = el.length ? el[0].querySelector("#chat-log") : null;
        if (log) log.scrollTop = log.scrollHeight;
    }

    /**
     * Update the content of a previously posted message after its data has been replaced
     * @param {ChatMessage} message   The ChatMessage instance to update
     * @param {boolean} notify        Trigger a notification which shows the log as having a new unread message
     */
    async updateMessage(message, notify = false) {
        let li = this.element.find(`.message[data-message-id="${message.id}"]`);
        if (li.length) {
            const html = await message.getHTML();
            li.replaceWith(html);
        }

        // Add a newly visible message to the log
        else {
            const messages = game.messages.contents;
            const messageIndex = messages.findIndex((m) => m === message);
            let nextMessage;
            for (let i = messageIndex + 1; i < messages.length; i++) {
                if (messages[i].visible) {
                    nextMessage = messages[i];
                    break;
                }
            }
            await this.postOne(message, false, { before: nextMessage?.id });
        }
    }

    _updateTimestamps() {
        const messages = this.element.find("#chat-log .message");
        for (let li of messages) {
            const message = game.messages.get(li.dataset["messageId"]);
            if (!message?.timestamp) return;
            const stamp = li.querySelector(".message-timestamp");
            stamp.textContent = foundry.utils.timeSince(message.timestamp);
        }
    }

    /** @inheritdoc */
    activateListeners(html) {
        // Load new messages on scroll
        html.find("#chat-log").scroll(this._onScrollLog.bind(this));

        // Single Message Delete
        html.on("click", "a.message-delete", this._onDeleteMessage.bind(this));

        // Chat Entry context menu
        this._contextMenu(html);
    }

    _contextMenu(html) {
        ContextMenu.create(
            this,
            html,
            ".message",
            this._getEntryContextOptions(),
        );
    }

    _getEntryContextOptions() {
        return [
            {
                name: "Jump to Pin",
                icon: '<i class="fas fa-bullseye"></i>',
                callback: (li) => {
                    const messageId = li.data("messageId");
                    const $message = $(
                        `#chat-log .chat-message[data-message-id="${messageId}"]`,
                    );
                    $message.get(0).scrollIntoView({
                        behavior: "smooth",
                    });
                },
            },
            {
                name: "Unpin Message",
                icon: '<i class="fas fa-thumbtack"></i>',
                condition: (li) => {
                    const message = game.messages.get(li.data("messageId"));
                    return game.user.isGM && this._chatPins.isPinned(message);
                },
                callback: async (li) => {
                    const message = game.messages.get(li.data("messageId"));
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
        const li = event.currentTarget.closest(".message");
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
            return this._renderBatch(
                this.element,
                CONFIG.ChatMessage.batchSize,
            );
        }
    }
}
