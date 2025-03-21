import { ChatPins } from "../chat-pins.ts";
import { Settings } from "../settings.ts";
import { Listener } from "./index.ts";

/**
 * Add new context menu operations to the chat log entries
 */
const GetChatLogEntryContext: Listener = {
    listen(): void {
        Hooks.on("getChatLogEntryContext", (_chatLogApp, entries) => {
            const chatPins = new ChatPins();
            const settings = new Settings();

            entries.unshift(
                {
                    name: "ChatPins.PinMessage",
                    icon: '<i class="fas fa-thumbtack"></i>',
                    condition: (li) => {
                        const messageId = li.data("messageId");
                        if (!messageId) return false;

                        const message = game.messages.get(messageId);
                        if (!message) return false;

                        const isOwner = message.testUserPermission(
                            game.user,
                            CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                        );

                        return (
                            game.user.role >= settings.pinPermission &&
                            isOwner &&
                            !chatPins.isPinned(message)
                        );
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

                        const isOwner = message.testUserPermission(
                            game.user,
                            CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
                        );

                        return (
                            game.user.role >= settings.pinPermission &&
                            isOwner &&
                            chatPins.isPinned(message)
                        );
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
