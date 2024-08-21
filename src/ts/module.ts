import "../styles/style.scss"; // Keep or else vite will not include this
import { id as MODULE_ID } from "@static/module.json";
import { libWrapper } from "@static/lib/shim.ts";
import { ChatPins } from "./chat-pins.ts";
import { findChatPinsLogApp } from "./foundry-helpers.ts";

/**
 * Handle setting up the app and lib wrapper overrides
 */
Hooks.once("ready", () => {
    /**
     * Overrides the standard flush so that pinned messages are not deleted
     */
    libWrapper.register(
        MODULE_ID,
        "Messages.prototype.flush",
        function (this: Messages, _wrapper: AnyFunction, ..._args: any) {
            const chatPins = new ChatPins();
            chatPins.deleteAllExceptPins();
        },
        "OVERRIDE",
    );
});

/**
 * Handle adding pin button to chat buttons
 */
Hooks.on("renderChatLog", (_chatLogApp, $html, _data) => {
    const chatPins = new ChatPins();
    chatPins.addPinButton($html);
});

/**
 * Handle modifying chat message when rendered to indicate pin status
 */
Hooks.on("renderChatMessage", (message, $html, _data) => {
    const chatPins = new ChatPins();

    if (chatPins.isPinned(message)) {
        const pinnedBy = game.i18n.format("ChatPins.PinnedBy", {
            pinner: chatPins.pinner(message),
        });
        const pinnedByHtml = $(`<p>${pinnedBy}</p>`);

        $html.css("border", "2px solid #ff6400");
        const messageHeader = $html.find(".message-header");
        pinnedByHtml.insertAfter(messageHeader);
    } else {
        $html.css("border", "");
    }
});

/**
 * Handle updating the chat pins log if open
 */
Hooks.on("updateChatMessage", (m, _update, _data) => {
    const message = m as ChatMessage;
    const chatPins = new ChatPins();
    const app = findChatPinsLogApp();

    if (!app) return;

    if (!message.visible || !chatPins.isPinned(message)) {
        app?.deleteMessage(message.id);
    } else {
        app?.updateMessage(message);
    }
});

/**
 * Handle updating the chat pins log if open
 */
Hooks.on("deleteChatMessage", (m, _data, _userId) => {
    const message = m as ChatMessage;
    const app = findChatPinsLogApp();

    if (!app) return;

    app.deleteMessage(message.id);
});

/**
 * Add new context menu operations to the chat log entries
 */
Hooks.on("getChatLogEntryContext", (_chatLogApp, entries) => {
    const chatPins = new ChatPins();

    entries.unshift(
        {
            name: "ChatPins.PinMessage",
            icon: '<i class="fas fa-thumbtack"></i>',
            condition: (li) => {
                const messageId = li.data("messageId");
                if (!messageId) return false;

                const message = game.messages.get(messageId);
                if (!message) return false;

                return game.user.isGM && !chatPins.isPinned(message);
            },
            callback: async (li) => {
                const messageId = li.data("messageId");
                if (!messageId) return;

                const message = game.messages.get(messageId);
                if (!message) return;

                await chatPins.pin(message);
            },
        },
        {
            name: "ChatPins.UnpinMessage",
            icon: '<i class="fas fa-thumbtack"></i>',
            condition: (li) => {
                const messageId = li.data("messageId");
                if (!messageId) return false;

                const message = game.messages.get(messageId);
                if (!message) return false;

                return game.user.isGM && chatPins.isPinned(message);
            },
            callback: async (li) => {
                const messageId = li.data("messageId");
                if (!messageId) return;

                const message = game.messages.get(messageId);
                if (!message) return;

                await chatPins.unpin(message);
            },
        },
    );
});
