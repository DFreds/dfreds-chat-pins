import { ChatPins } from "../chat-pins.ts";
import { Listener } from "./index.ts";
import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";

/**
 * Add new context menu operations to the chat log entries
 */
const GetChatMessageContextOptions: Listener = {
    listen(): void {
        Hooks.on("getChatMessageContextOptions", (_chatLogApp, entries) => {
            const chatPins = new ChatPins();

            (entries as ContextMenuEntry[]).unshift(
                {
                    label: "ChatPins.PinMessage",
                    icon: '<i class="fas fa-thumbtack"></i>',
                    visible: (html: HTMLElement) => {
                        const message = messageFrom(html);
                        return !!message && chatPins.canModify(message) && !chatPins.isPinned(message);
                    },
                    onClick: async (_event: PointerEvent, target: HTMLElement) => {
                        const message = messageFrom(target);
                        if (message) await chatPins.pin(message);
                    },
                },
                {
                    label: "ChatPins.UnpinMessage",
                    icon: '<i class="fas fa-thumbtack"></i>',
                    visible: (html: HTMLElement) => {
                        const message = messageFrom(html);
                        return !!message && chatPins.canModify(message) && chatPins.isPinned(message);
                    },
                    onClick: async (_event: PointerEvent, target: HTMLElement) => {
                        const message = messageFrom(target);
                        if (message) await chatPins.unpin(message);
                    },
                },
            );
        });
    },
};

function messageFrom(element: HTMLElement): ChatMessage | undefined {
    return game.messages.get(element.dataset.messageId ?? "");
}

export { GetChatMessageContextOptions };
