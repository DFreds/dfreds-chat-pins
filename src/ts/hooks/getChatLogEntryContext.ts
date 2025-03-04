import { ChatPins } from "../chat-pins.ts";
import { Listener } from "./index.ts";

/**
 * Add new context menu operations to the chat log entries
 */
const GetChatLogEntryContext: Listener = {
    listen(): void {
        Hooks.on("getChatLogEntryContext", (_chatLogApp, entries) => {
            const chatPins = new ChatPins();

            entries.unshift(
                {
                    name: EN_JSON.ChatPins.PinMessage,
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
                    name: EN_JSON.ChatPins.UnpinMessage,
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
    },
};

export { GetChatLogEntryContext };
