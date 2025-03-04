import { ChatPins } from "../chat-pins.ts";
import { findChatPinsLogApp } from "../foundry-helpers.ts";
import { Listener } from "./index.ts";

/**
 * Handle updating the chat pins log if open
 */
const UpdateChatMessage: Listener = {
    listen(): void {
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
    },
};

export { UpdateChatMessage };
