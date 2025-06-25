import {
    ApplicationClosingOptions,
    ApplicationConfiguration,
} from "@client/applications/_types.mjs";
import { Settings } from "./settings.ts";
import { ChatPins } from "./chat-pins.ts";
import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";
import { HandlebarsRenderOptions } from "@client/applications/api/handlebars-application.mjs";
import Messages from "@client/documents/collections/chat-messages.mjs";
import { ChatMessageSource } from "@common/documents/chat-message.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class ChatPinsLogV2 extends HandlebarsApplicationMixin(
    ApplicationV2<ApplicationConfiguration, HandlebarsRenderOptions, object>,
) {
    #settings: Settings;

    constructor() {
        super();
        this.#settings = new Settings();
    }

    static override DEFAULT_OPTIONS: DeepPartial<ApplicationConfiguration> = {
        id: "chat-pins",
        classes: [
            "tab",
            "sidebar-tab",
            "flexcol",
            "chat-sidebar",
            "active",
            "sidebar-popout",
        ],
        tag: "section",
        window: {
            icon: "fa-solid fa-thumbtack",
            title: "ChatPins.AppName",
            resizable: true,
            minimizable: true,
        },
        position: {
            width: 300,
            height: 1000,
        },
        actions: {
            deleteMessage: ChatPinsLogV2.#onDeleteMessage,
            // jumpToBottom: this.#onJumpToBottom,
        },
    };

    static override PARTS = {
        log: {
            template: "modules/dfreds-chat-pins/templates/chat-pins-app.hbs",
            scrollable: [".chat-log"],
        },
    };

    /**
     * How often, in milliseconds, to update timestamps.
     */
    static UPDATE_TIMESTAMP_FREQUENCY = 1000 * 15;

    /**
     * A references to the Messages collection that the chat pins log displays.
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
                    author: message?.author?.id,
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

    /**
     * A flag for whether the chat log is currently scrolled to the bottom
     */
    get isAtBottom(): boolean {
        return this.#isAtBottom;
    }

    #isAtBottom: boolean = true;

    /**
     * The jump to bottom button.
     */
    // #jumpToBottomElement: HTMLButtonElement | null = null;

    /**
     * Track the ID of the oldest message displayed in the log.
     */
    #lastId: string | null | undefined = null;

    /**
     * A semaphore to queue rendering of Chat Messages.
     */
    #renderingQueue: foundry.utils.Semaphore = new foundry.utils.Semaphore(1);

    /**
     * Whether batch rendering is currently in progress.
     */
    #renderingBatch: boolean = false;

    /**
     * The chat pins instance.
     */
    #chatPins: ChatPins = new ChatPins();

    protected override _configureRenderOptions(
        options: HandlebarsRenderOptions,
    ): void {
        super._configureRenderOptions(options);
        // If the log has already been rendered once, prevent it from being re-rendered.
        if (this.rendered) {
            options.parts = options.parts?.filter((p) => p !== "log");
        }
    }

    /**
     * Render a batch of additional messages, prepending them to the top of the log.
     *
     * @param size - The batch size.
     * @returns
     */
    async #doRenderBatch(size: number): Promise<void> {
        const messages = this.collection.contents;
        const log = this.element.querySelector(".chat-log");

        // Get the index of the last rendered chat message
        let lastIdx = messages.findIndex(
            (m: { id: string | null | undefined }) => m.id === this.#lastId,
        );
        lastIdx = lastIdx > -1 ? lastIdx : messages.length;
        if (!lastIdx) {
            this.#renderingBatch = false;
            return;
        }

        // Get the next batch to render
        const targetIdx = Math.max(lastIdx - size, 0);
        const elements = [];
        for (let i = targetIdx; i < lastIdx; i++) {
            const message = messages[i];
            if (!message.visible) continue;
            message.logged = true;
            try {
                elements.push(await ChatPinsLogV2.renderMessage(message));
            } catch (err) {
                console.error(err);
            }
        }

        // Prepend the HTML
        log?.prepend(...elements);
        this.#lastId = messages[targetIdx].id;
        this.#renderingBatch = false;
    }

    /**
     * Get the context menu entries for chat messages in the log.
     *
     * @returns The context menu options.
     */
    #getEntryContextOptions(): ContextMenuEntry[] {
        return [
            {
                name: "ChatPins.JumpToPin",
                icon: '<i class="fas fa-bullseye"></i>',
                condition: () => true,
                callback: (li) => {
                    const messageId = $(li).data("messageId");
                    const $message = $(
                        `#chat .chat-message[data-message-id="${messageId}"], #chat-popout .chat-message[data-message-id="${messageId}"]`,
                    );
                    $message.each((_index, element) => {
                        (element as HTMLElement).scrollIntoView({
                            behavior: "smooth",
                        });
                    });
                },
            },
            {
                name: "ChatPins.UnpinMessage",
                icon: '<i class="fas fa-thumbtack"></i>',
                condition: (li) => {
                    const messageId = $(li).data("messageId");
                    if (!messageId) return false;

                    const message = game.messages.get(messageId);
                    if (!message) return false;

                    const isOwner = message.testUserPermission(
                        game.user,
                        CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                    );

                    return (
                        game.user.role >= this.#settings.pinPermission &&
                        isOwner &&
                        this.#chatPins.isPinned(message)
                    );
                },
                callback: async (li) => {
                    const message = game.messages.get(
                        li.dataset.messageId ?? "",
                    );
                    if (!message) return;
                    await this.#chatPins.unpin(message);
                    await this.render(); // ._renderHTML({}, {}); used to be _renderInner
                },
            },
            // @ts-expect-error Not the best, but easiest way to get options from foundry
            ...ChatLog.prototype._getEntryContextOptions(),
        ];
    }

    protected override async _onFirstRender(
        context: object,
        options: HandlebarsRenderOptions,
    ): Promise<void> {
        await super._onFirstRender(context, options);

        setInterval(
            this.updateTimestamps.bind(this),
            ChatPinsLogV2.UPDATE_TIMESTAMP_FREQUENCY,
        );

        await this.renderBatch(CONFIG.ChatMessage.batchSize);
        await this.scrollBottom({ waitImages: true });

        // // @ts-expect-error not sure why
        // $(this.element).scroll(this.#onScrollLog.bind(this));

        // create context menu
        this._createContextMenu(
            this.#getEntryContextOptions,
            ".message[data-message-id]",
        );
    }

    protected override async _onRender(
        context: object,
        options: HandlebarsRenderOptions,
    ): Promise<void> {
        await super._onRender(context, options);

        if (this.options.classes.includes("themed")) return;

        this.element.classList.remove("theme-light", "theme-dark");
        const { colorScheme } = game.settings.get("core", "uiConfig") as {
            colorScheme: { interface: string };
        };

        if (colorScheme.interface) {
            this.element.classList.add(
                "themed",
                `theme-${colorScheme.interface}`,
            );
        }
    }

    protected override async _preparePartContext(
        partId: string,
        context: object,
        options: HandlebarsRenderOptions,
    ): Promise<object> {
        await super._preparePartContext(partId, context, options);
        // switch (partId) {
        //     case "input":
        //         await this._prepareInputContext(context, options);
        //         break;
        // }
        return context;
    }

    protected override _attachPartListeners(
        partId: string,
        element: HTMLElement,
        options: HandlebarsRenderOptions,
    ): void {
        super._attachPartListeners(partId, element, options);
        switch (partId) {
            case "log":
                this._attachLogListeners(element, options);
                break;
        }
    }

    _attachLogListeners(
        element: HTMLElement,
        _options: HandlebarsRenderOptions,
    ): void {
        // @ts-expect-error complaining about type
        element.addEventListener("scroll", this.#onScrollLog.bind(this), {
            passive: true,
        });
    }

    protected override _onClose(options: ApplicationClosingOptions): void {
        super._onClose(options);
        this.#lastId = null;
    }

    static async #onDeleteMessage(event: Event): Promise<void> {
        const thisApp = this as unknown as ChatPinsLogV2;

        event.preventDefault();
        const target = event.target as HTMLElement;
        const { messageId } =
            (target.closest("[data-message-id]") as HTMLElement)?.dataset ?? {};
        const message = game.messages.get(messageId ?? "");
        if (message) await message.delete();
        else await thisApp.deleteMessage(messageId ?? "");
    }

    async #onScrollLog(event?: UIEvent): Promise<void> {
        if (!this.rendered) return;
        const log =
            (event?.currentTarget as HTMLElement) ??
            (this.element.querySelector(".chat-log") as HTMLElement);

        if (!log) return;

        const pct = log.scrollTop / (log.scrollHeight - log.clientHeight);
        this.#isAtBottom = pct > 0.99 || Number.isNaN(pct);
        // this.#jumpToBottomElement.toggleAttribute("hidden", this.#isAtBottom);
        log.classList.toggle("scrolled", !this.#isAtBottom);
        const top = log.children[0] as HTMLElement;
        if (pct < 0.01)
            return this.renderBatch(CONFIG.ChatMessage.batchSize).then(() => {
                // Retain the scroll position at the top-most element before the extra messages were prepended to the log.
                if (top) log.scrollTop = top.offsetTop;
            });
    }

    async deleteMessage(
        messageId: string,
        options: object = {},
    ): Promise<void> {
        return this.#renderingQueue.add(
            this.#deleteMessage.bind(this),
            messageId,
            options,
        );
    }

    async postOne(message: ChatMessage, options = {}): Promise<void> {
        if (!message.visible) return;
        return this.#renderingQueue.add(
            this.#postOne.bind(this),
            message,
            options,
        );
    }

    async renderBatch(size: number): Promise<void> {
        if (this.#renderingBatch) return;
        this.#renderingBatch = true;
        return this.#renderingQueue.add(this.#doRenderBatch.bind(this, size));
    }

    async #rerenderMessage(
        message: ChatMessage,
        existing: HTMLElement,
        options: object = {},
    ) {
        const expanded = Array.from(
            existing.querySelectorAll('[data-action="expandRoll"]'),
        ).map((el) => {
            return el.classList.contains("expanded");
        });
        const replacement = await ChatPinsLogV2.renderMessage(message, options);
        const rolls = replacement.querySelectorAll(
            '[data-action="expandRoll"]',
        );
        for (let i = 0; i < rolls.length; i++)
            rolls[i].classList.toggle("expanded", expanded[i]);
        existing.replaceWith(replacement);
    }

    async scrollBottom({
        waitImages = false,
    }: {
        popout?: boolean;
        waitImages?: boolean;
        scrollOptions?: object;
    } = {}): Promise<void> {
        if (!this.rendered) return;
        const scroll = this.element.querySelector(".chat-scroll");
        if (!scroll) return;
        if (waitImages) {
            await ChatPinsLogV2.waitForImages(scroll as HTMLElement);
        }
        scroll.scrollTop = Number.MAX_SAFE_INTEGER;
    }

    async updateMessage(message: ChatMessage): Promise<void> {
        const li = this.element.querySelector(
            `.message[data-message-id="${message.id}"]`,
        );
        if (li) await this.#rerenderMessage(message, li as HTMLElement);
        // A previously invisible message has become visible to this user.
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
                notify: false,
            });
        }
    }

    updateTimestamps(): void {
        const messages = document.querySelectorAll(
            "#chat-pins .chat-message[data-message-id]",
        );

        if (!messages) return;

        for (const li of messages) {
            const message = game.messages.get(
                (li as HTMLElement).dataset.messageId ?? "",
            );
            if (!message?.timestamp) return;
            const stamp = li.querySelector(".message-timestamp");
            if (stamp) {
                stamp.textContent = foundry.utils.timeSince(
                    message.timestamp as unknown as string,
                );
            }
        }
    }

    #deleteMessage(messageId: string, _options: object = {}): void {
        // Get the chat message being removed from the log
        const message = game.messages.get(messageId);
        if (message) message.logged = false;

        // Get the message's element
        const li = this.element.querySelector(
            `.message[data-message-id="${messageId}"]`,
        );
        if (!li) return;

        if (messageId === this.#lastId) {
            this.#lastId =
                (li.nextElementSibling as HTMLElement)?.dataset.messageId ??
                null;
        }

        // Remove the deleted message
        li.classList.add("deleting");
        li.animate(
            { height: [`${li.getBoundingClientRect().height}px`, "0"] },
            { duration: 100, easing: "ease" },
        ).finished.then(() => {
            li.remove();
            this.#onScrollLog();
        });
    }

    async #postOne(message: ChatMessage, { before }: { before?: string }) {
        message.logged = true;

        // Track internal flags
        if (!this.#lastId) this.#lastId = message.id; // Ensure that new messages don't result in batched scrolling.

        // Render the message to the log
        const log = this.element.querySelector(".chat-log") as HTMLElement;
        const html = await ChatPinsLogV2.renderMessage(message);

        // Due to latency, a newer message might have been posted to the log. If so, place this message behind it.
        if (!before) {
            let newerMessage;
            for (let i = log.children.length; (i -= 1); ) {
                const msg = game.messages.get(
                    (log.children[i] as HTMLElement).dataset.messageId ?? "",
                );
                if (!msg) continue;
                if (msg.timestamp <= message.timestamp) break;
                newerMessage = msg;
            }
            before = newerMessage?.id;
        }

        // Append the message after some other one
        const existing = before
            ? this.element.querySelector(
                  `.message[data-message-id="${before}"]`,
              )
            : null;
        if (existing) existing.insertAdjacentElement("beforebegin", html);
        // Otherwise, append the message to the bottom of the log
        else {
            log.append(html);
            if (this.isAtBottom || message.author?._id === game.user._id) {
                this.scrollBottom({ waitImages: true });
            }
        }
    }

    static async renderMessage(
        message: ChatMessage,
        options = {},
    ): Promise<HTMLElement> {
        const hasGetHTML =
            foundry.utils.getDefiningClass(message, "getHTML") !== ChatMessage;
        if (!hasGetHTML) return message.renderHTML(options);
        // @ts-expect-error it exists, not typed
        const html = await message.getHTML(options);
        if (html instanceof HTMLElement) return html;
        if (html[0] instanceof HTMLElement) return html[0];
        throw new Error(
            `Unable to render ChatMessage [${message.id}] as it did not return an HTMLElement or jQuery.`,
        );
    }
}

export { ChatPinsLogV2 };
