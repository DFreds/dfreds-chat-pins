import { ChatPins } from "../chat-pins.ts";
import { Settings } from "../settings.ts";
import { Listener } from "./index.ts";
import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";

/**
 * Add new context menu operations to the chat log entries
 */
const GetChatMessageContextOptions: Listener = {
    listen(): void {
        Hooks.on("getChatMessageContextOptions", (_chatLogApp, entries) => {
            const chatPins = new ChatPins();
            const settings = new Settings();

            (entries as ContextMenuEntry[]).unshift(
                {
                    label: "ChatPins.PinMessage",
                    icon: '<i class="fas fa-thumbtack"></i>',
                    visible: (html: HTMLElement) => {
                        const messageId = $(html).data("messageId");
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
                    onClick: async (_event: PointerEvent, target: HTMLElement) => {
                        const messageId = $(target).data("messageId");
                        if (!messageId) return;

                        const message = game.messages.get(messageId);
                        if (!message) return;

                        await chatPins.pin(message);
                    },
                },
                {
                    label: "ChatPins.UnpinMessage",
                    icon: '<i class="fas fa-thumbtack"></i>',
                    visible: (html: HTMLElement) => {
                        const messageId = $(html).data("messageId");
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
                    onClick: async (_event: PointerEvent, target: HTMLElement) => {
                        const messageId = $(target).data("messageId");
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

export { GetChatMessageContextOptions };
