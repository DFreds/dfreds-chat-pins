import { ChatMessageSource } from "types/foundry/common/documents/chat-message.js";
import { ChatPins } from "./chat-pins.ts";

class ChatPinsLog extends Application {
    #lastId: string | null | undefined;
    #chatPins: ChatPins;

    /**
     * A flag for whether the chat log is currently scrolled to the bottom
     * @type {boolean}
     */
    #isAtBottom: boolean = true;

    /**
     * A semaphore to queue rendering of Chat Messages.
     * @type {Semaphore}
     */
    #renderingQueue: foundry.utils.Semaphore = new foundry.utils.Semaphore(1);

    /**
     * Currently rendering the next batch?
     * @type {boolean}
     */
    #renderingBatch: boolean = false;

    constructor(options?: Partial<ApplicationOptions>) {
        super(options);

        /**
         * Track the id of the last message displayed in the log
         * @type {string|null}
         * @private
         */
        this.#lastId = null;

        this.#chatPins = new ChatPins();

        // Update timestamps every 15 seconds
        setInterval(this.updateTimestamps.bind(this), 1000 * 15);
    }

    /**
     * Returns if the chat log is currently scrolled to the bottom
     */
    get isAtBottom(): boolean {
        return this.#isAtBottom;
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
            stream: false,
            scrollY: ["#chat-log"],
        });
    }

    /**
     * A reference to the Messages collection that the chat log displays
     * @type {Messages}
     */
    get collection(): Messages {
        const pinnedMessages = game.messages
            .filter((message) => this.#chatPins.isPinned(message))
            .map((message) => {
                return {
                    _id: message._id,
                    type: message.type,
                    system: message.system,
                    style: message.style,
                    author: message.author.id,
                    timestamp: message.timestamp,
                    flavor: message.flavor,
                    content: message.content,
                    speaker: message.speaker,
                    whisper: message.whisper,
                    blind: message.blind,
                    rolls: message.rolls.map((roll) => JSON.stringify(roll)),
                    sound: message.sound,
                    emote: message.emote,
                    flags: message.flags,
                    _stats: message._stats,
                } as ChatMessageSource;
            });

        return new Messages(pinnedMessages);
    }

    protected override async _render(
        force?: boolean | undefined,
        options?: RenderOptions | undefined,
    ): Promise<void> {
        if (this.rendered) return; // Never re-render the Chat Log itself, only its contents
        await super._render(force, options);
        return this.scrollBottom({ waitImages: true });
    }

    protected override async _renderInner(
        data: object,
        options: RenderOptions,
    ): Promise<JQuery<HTMLElement>> {
        const html = await super._renderInner(data, options);
        await this.#renderBatch(html, CONFIG.ChatMessage.batchSize);
        return html;
    }

    /**
     * Render a batch of additional messages, prepending them to the top of the log
     * @param {jQuery} html     The rendered jQuery HTML object
     * @param {number} size     The batch size to include
     * @returns {Promise<void>}
     * @private
     */
    async #renderBatch(html: JQuery<HTMLElement>, size: number): Promise<void> {
        if (this.#renderingBatch) return;
        this.#renderingBatch = true;
        return this.#renderingQueue.add(async () => {
            const messages = this.collection.contents;
            const log = html.find("#chat-log, #chat-log-popout");

            // Get the index of the last rendered message
            let lastIdx = messages.findIndex((m) => m.id === this.#lastId);
            lastIdx = lastIdx !== -1 ? lastIdx : messages.length;

            // Get the next batch to render
            const targetIdx = Math.max(lastIdx - size, 0);
            let m = null;
            if (lastIdx !== 0) {
                const html = [];
                for (let i = targetIdx; i < lastIdx; i++) {
                    m = messages[i];
                    if (!m.visible) continue;
                    m.logged = true;
                    try {
                        html.push(await m.getHTML());
                    } catch (err: any) {
                        err.message = `Chat message ${m.id} failed to render: ${err})`;
                        console.error(err);
                    }
                }

                // Prepend the HTML
                log.prepend(html);
                this.#lastId = messages[targetIdx].id;
                this.#renderingBatch = false;
            }
        });
    }

    /* -------------------------------------------- */
    /*  Chat Sidebar Methods                        */
    /* -------------------------------------------- */

    /**
     * Delete a single message from the chat log
     * @param messageId    The ChatMessage document to remove from the log
     */
    deleteMessage(messageId: string): Promise<void> {
        return this.#renderingQueue.add(async () => {
            // Get the chat message being removed from the log
            const message = game.messages.get(messageId, { strict: false });
            if (message) message.logged = false;

            // Get the current HTML element for the message
            const li = this.element.find(
                `.message[data-message-id="${messageId}"]`,
            );
            if (!li.length) return;

            if (messageId === this.#lastId) {
                const next = li[0].nextElementSibling as HTMLElement;
                this.#lastId = next ? next.dataset.messageId : null;
            }

            // Remove the deleted message
            li.slideUp(100, () => li.remove());

            // Delete from popout tab
            // if (this._popout)
            //     this._popout.deleteMessage(messageId, { deleteAll });
            // if (this.popOut) this.setPosition();
        });
    }

    /**
     * Post a single chat message to the log
     * @param message   A ChatMessage document instance to post to the log
     * @param [options={}]   Additional options for how the message is posted to the log
     * @param [options.before] An existing message ID to append the message before, by default the new message is
     *                                  appended to the end of the log.
     * @returns        A Promise which resolves once the message is posted
     */
    async postOne(
        message: ChatMessage,
        options: { before?: string } = {},
    ): Promise<void> {
        if (!message.visible) return;
        return this.#renderingQueue.add(async () => {
            message.logged = true;

            // Track internal flags
            if (!this.#lastId) this.#lastId = message.id; // Ensure that new messages don't result in batched scrolling

            // Render the message to the log
            const html = await message.getHTML();
            const log = this.element.find("#chat-log");

            // Append the message after some other one
            const existing = options.before
                ? this.element.find(
                      `.message[data-message-id="${options.before}"]`,
                  )
                : null;
            if (existing?.length) existing.before(html);
            // Otherwise, append the message to the bottom of the log
            else {
                log.append(html);
                if (this.isAtBottom || message.author._id === game.user._id)
                    this.scrollBottom({ waitImages: true });
            }

            // Update popout tab
            // if (this._popout)
            //     await this._popout.postOne(message, { before, notify: false });
            // if (this.popOut) this.setPosition();
        });
    }

    /* -------------------------------------------- */

    /**
     * Scroll the chat log to the bottom
     * @param [options]
     * @param [options.popout=false]                 If a popout exists, scroll it to the bottom too.
     * @param [options.waitImages=false]             Wait for any images embedded in the chat log to load first
     *                                                         before scrolling?
     * @param [options.scrollOptions]  Options to configure scrolling behavior.
     */
    async scrollBottom(
        options: {
            popout?: boolean;
            waitImages: boolean;
            scrollOptions?: object;
        } = {
            popout: false,
            waitImages: false,
            scrollOptions: {},
        },
    ): Promise<void> {
        if (!this.rendered) return;
        if (options.waitImages) await this._waitForImages();
        const log = this.element[0].querySelector("#chat-log");
        log?.lastElementChild?.scrollIntoView(options.scrollOptions);
        // if (popout) this._popout?.scrollBottom({ waitImages, scrollOptions });
    }

    /* -------------------------------------------- */

    /**
     * Update the content of a previously posted message after its data has been replaced
     * @param message   The ChatMessage instance to update
     */
    async updateMessage(message: ChatMessage): Promise<void> {
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
            await this.postOne(message, {
                before: nextMessage?.id,
            });
        }

        // Update popout tab
        // if (this._popout) await this._popout.updateMessage(message, false);
        // if (this.popOut) this.setPosition();
    }

    /* -------------------------------------------- */

    /**
     * Update the displayed timestamps for every displayed message in the chat log.
     * Timestamps are displayed in a humanized "time since" format.
     */
    updateTimestamps(): void {
        const messages = this.element.find("#chat-log .message");
        for (const li of messages) {
            const message = game.messages.get(li.dataset.messageId ?? "");
            if (!message?.timestamp) return;
            const stamp = li.querySelector(".message-timestamp");

            if (stamp) {
                stamp.textContent = foundry.utils.timeSince(message.timestamp);
            }
        }
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers
  /* -------------------------------------------- */

    override activateListeners(html: JQuery<HTMLElement>): void {
        // Load new messages on scroll
        // html.find("#chat-log").scroll(this.#onScrollLog.bind(this));

        // Single Message Delete
        html.on("click", "a.message-delete", this.#onDeleteMessage.bind(this));

        // Jump to Bottom
        html.find(".jump-to-bottom > a").click(() => this.scrollBottom());

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

    /* -------------------------------------------- */

    /**
     * Get the ChatLog entry context options
     * @return {object[]}   The ChatLog entry context options
     * @private
     */
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
            // {
            //     name: "CHAT.PopoutMessage",
            //     icon: '<i class="fas fa-external-link-alt fa-rotate-180"></i>',
            //     condition: (li) => {
            //         const message = game.messages.get(li.data("messageId"));
            //         return message.getFlag("core", "canPopout") === true;
            //     },
            //     callback: (li) => {
            //         const message = game.messages.get(li.data("messageId"));
            //         new ChatPopout(message).render(true);
            //     },
            // },
            // {
            //     name: "CHAT.RevealMessage",
            //     icon: '<i class="fas fa-eye"></i>',
            //     condition: (li) => {
            //         const message = game.messages.get(li.data("messageId"));
            //         const isLimited = message.whisper.length || message.blind;
            //         return (
            //             isLimited &&
            //             (game.user.isGM || message.isAuthor) &&
            //             message.isContentVisible
            //         );
            //     },
            //     callback: (li) => {
            //         const message = game.messages.get(li.data("messageId"));
            //         return message.update({ whisper: [], blind: false });
            //     },
            // },
            // {
            //     name: "CHAT.ConcealMessage",
            //     icon: '<i class="fas fa-eye-slash"></i>',
            //     condition: (li) => {
            //         const message = game.messages.get(li.data("messageId"));
            //         const isLimited = message.whisper.length || message.blind;
            //         return (
            //             !isLimited &&
            //             (game.user.isGM || message.isAuthor) &&
            //             message.isContentVisible
            //         );
            //     },
            //     callback: (li) => {
            //         const message = game.messages.get(li.data("messageId"));
            //         return message.update({
            //             whisper: ChatMessage.getWhisperRecipients("gm").map(
            //                 (u) => u.id,
            //             ),
            //             blind: false,
            //         });
            //     },
            // },
            // {
            //     name: "SIDEBAR.Delete",
            //     icon: '<i class="fas fa-trash"></i>',
            //     condition: (li) => {
            //         const message = game.messages.get(li.data("messageId"));
            //         return message.canUserModify(game.user, "delete");
            //     },
            //     callback: (li) => {
            //         const message = game.messages.get(li.data("messageId"));
            //         return message.delete();
            //     },
            // },
        ];
    }

    /**
     * Handle single message deletion workflow
     * @param {Event} event
     * @private
     */
    #onDeleteMessage(event: Event): Promise<ChatMessage | undefined | void> {
        event.preventDefault();
        const li = (event.currentTarget as HTMLElement)?.closest(
            ".message",
        ) as HTMLElement;
        const messageId = li?.dataset?.messageId;
        const message = game.messages.get(messageId ?? "");
        return message ? message.delete() : this.deleteMessage(messageId ?? "");
    }

    /**
     * Handle scroll events within the chat log container
     *
     * @param {UIEvent} event   The initial scroll event
     * @private
     */
    #onScrollLog(event: UIEvent): Promise<void> | void {
        if (!this.rendered) return;
        const log = event.target! as HTMLElement;
        const pct = log.scrollTop / (log.scrollHeight - log.clientHeight);
        this.#isAtBottom = pct > 0.99;
        if (pct < 0.01)
            return this.#renderBatch(
                this.element,
                CONFIG.ChatMessage.batchSize,
            );
    }
}

export { ChatPinsLog };
