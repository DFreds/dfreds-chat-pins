import { ChatPins } from "../src/ts/chat-pins.ts";

// OLD WAY
class ChatPinsLogOld extends Application {
    #lastId: string | null;
    #lastWhisper: ChatMessage | null;
    #chatPins: ChatPins;

    constructor(options?: Partial<ApplicationOptions>) {
        super(options);

        /**
         * Track the id of the last message displayed in the log
         * @type {string|null}
         * @private
         */
        this.#lastId = null;

        /**
         * Track the last received message which included the user as a whisper recipient.
         * @type {ChatMessage|null}
         * @private
         */
        this.#lastWhisper = null;

        // Update timestamps every 15 seconds
        setInterval(this.#updateTimestamps.bind(this), 1000 * 15);

        this.#chatPins = new ChatPins();
    }

    static override get defaultOptions(): ApplicationOptions {
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

    /**
     * A reference to the pinned Messages collection that the chat log displays
     * @type {Messages}
     */
    get collection(): ChatMessage[] {
        return game.messages.filter((message) =>
            this.#chatPins.isPinned(message),
        );
    }

    protected override async _render(
        force?: boolean | undefined,
        options?: RenderOptions | undefined,
    ): Promise<void> {
        if (this.rendered) return; // never re-render the Chat Log itself, only it's contents
        await super._render(force, options);
        return this.#scrollBottom();
    }

    protected override async _renderInner(
        data: object,
        options: RenderOptions,
    ): Promise<JQuery<HTMLElement>> {
        const html = await super._renderInner(data, options);
        await this.#renderBatch(html, CONFIG.ChatMessage.batchSize);
        return html;
    }

    async #renderBatch(html: JQuery<HTMLElement>, size: number): Promise<void> {
        const messages = this.collection;
        const log = html.find("#chat-log");

        // Get the index of the last rendered message
        let lastIdx = messages.findIndex((m) => m.id === this.#lastId);
        lastIdx = lastIdx !== -1 ? lastIdx : messages.length;

        // Get the next batch to render
        const targetIdx = Math.max(lastIdx - size, 0);
        let m: ChatMessage | null = null;
        if (lastIdx !== 0) {
            const html: JQuery<HTMLElement>[] = [];
            for (let i = targetIdx; i < lastIdx; i++) {
                m = messages[i];
                if (!m.visible) continue;
                m.logged = true;
                try {
                    html.push(await m.getHTML());
                } catch (err: any) {
                    err.message = `Chat message ${m.id} failed to render: ${err}`;
                    console.error(err);
                }
            }

            // Prepend the HTML
            log.prepend(html);
            this.#lastId = messages[targetIdx].id;
        }
    }

    /**
     * Delete a single message from the chat log
     *
     * @param messageId - the ChatMessage document to remove from the log
     * @param options - options to deleting the message
     */
    deleteMessage(
        messageId: string,
        options: { deleteAll: boolean } = { deleteAll: false },
    ): void {
        // Get the chat message being removed from the log
        const message = game.messages.get(messageId, { strict: false });
        if (message) message.logged = false;

        // Get the current HTML element for the message
        const li = this.element.find(
            `.message[data-message-id="${messageId}"]`,
        );
        if (!li.length) return;

        // Update the last index
        if (options.deleteAll) {
            this.#lastId = null;
        } else if (messageId === this.#lastId) {
            const next = li[0].nextElementSibling as HTMLElement;
            if (next !== null) {
                this.#lastId = next.dataset["messageId"] ?? null;
            } else {
                this.#lastId = null;
            }
        }

        // Remove the deleted message
        li.slideUp(100, () => li.remove());
    }

    /**
     * Post a single chat message to the log
     *
     * @param message - A ChatMessage document instance to post to the log
     * @param _notify - Trigger a notification which shows the log as having a new unread message
     * @param options - Additional options for how the message is posted to the log
     * @returns a promise which resolves once the message is posted
     */
    async postOne(
        message: ChatMessage,
        _notify: boolean = false,
        options: { before?: string } = {},
    ): Promise<void> {
        if (!message.visible) return;
        message.logged = true;

        // Track internal flags
        if (!this.#lastId) this.#lastId = message.id; // Ensure that new messages don't result in batched scrolling
        if ((message.whisper || []).includes(game.user.id) && !message.isRoll) {
            this.#lastWhisper = message;
        }

        // Render the message to the log
        const html = await message.getHTML();
        const log = this.element.find("#chat-log");

        // Append the message after some other one
        const existing = options.before
            ? this.element.find(`.message[data-message-id="${options.before}"]`)
            : null;
        if (existing) existing.before(html);
        // Otherwise, append the message to the bottom of the log
        else {
            log.append(html);
            this.#scrollBottom();
        }
    }

    #scrollBottom(): void {
        const el = this.element;
        const log = el.length ? el[0].querySelector("#chat-log") : null;
        if (log) log.scrollTop = log.scrollHeight;
    }

    /**
     * Update the content of a previously posted message after its data has been replaced
     *
     * @param message - The ChatMessage instance to update
     * @param _notify - Trigger a notification which shows the log as having a new unread message
     */
    async updateMessage(
        message: ChatMessage,
        _notify: boolean = false,
    ): Promise<void> {
        const li = this.element.find(
            `.message[data-message-id="${message.id}"]`,
        );
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

    #updateTimestamps() {
        const messages = this.element.find("#chat-log .message");
        for (const li of messages) {
            const messageId = li.dataset["messageId"];
            if (!messageId) return;

            const message = game.messages.get(messageId);
            if (!message?.timestamp) return;

            const stamp = li.querySelector(".message-timestamp");
            if (!stamp) return;

            stamp.textContent = foundry.utils.timeSince(message.timestamp);
        }
    }

    override activateListeners(html: JQuery<HTMLElement>): void {
        // Load new messages on scroll
        html.find("#chat-log").scroll(this.#onScrollLog.bind(this) as any);

        // Single Message Delete
        html.on("click", "a.message-delete", this.#onDeleteMessage.bind(this));

        // Chat Entry context menu
        this.#contextMenu(html);
    }

    #contextMenu(html: JQuery<HTMLElement>) {
        ContextMenu.create(
            this,
            html,
            ".message",
            this.#getEntryContextOptions(),
        );
    }

    #getEntryContextOptions(): EntryContextOption[] {
        return [
            {
                name: "Jump to Pin",
                icon: '<i class="fas fa-bullseye"></i>',
                condition: () => true,
                callback: (li) => {
                    const messageId = li.data("messageId");
                    const $message = $(
                        `#chat-log .chat-message[data-message-id="${messageId}"]`,
                    );
                    $message?.get(0)?.scrollIntoView({
                        behavior: "smooth",
                    });
                },
            },
            {
                name: "Unpin Message",
                icon: '<i class="fas fa-thumbtack"></i>',
                condition: (li) => {
                    const message = game.messages.get(li.data("messageId"));
                    if (!message) return false;
                    return game.user.isGM && this.#chatPins.isPinned(message);
                },
                callback: async (li) => {
                    const message = game.messages.get(li.data("messageId"));
                    if (!message) return;
                    await this.#chatPins.unpin(message);
                    await this._renderInner({}, {});
                },
            },
            ...ChatLog.prototype._getEntryContextOptions(),
        ];
    }

    /**
     * Handle single message deletion workflow
     *
     * @param event - the event that triggered the deletion
     */
    #onDeleteMessage(
        event: Event,
    ): Promise<ChatMessage | undefined> | undefined {
        event.preventDefault();
        const li = (event.currentTarget as HTMLElement)?.closest(
            ".message",
        ) as HTMLElement;
        if (!li) return;

        const messageId = li.dataset.messageId;
        if (!messageId) return;

        const message = game.messages.get(messageId);
        return message?.delete();
    }

    /**
     * Handle scroll events within the chat log container
     *
     * @param event - The initial scroll event
     */
    #onScrollLog(event: Event): Promise<void> | void {
        if (!this.rendered) return;

        const log = event.target as HTMLElement;
        const pct = log.scrollTop / log.scrollHeight;
        if (pct < 0.01) {
            return this.#renderBatch(
                this.element,
                CONFIG.ChatMessage.batchSize,
            );
        }
    }
}
