import { findChatPinsLogApp } from "../foundry-helpers.ts";
import { Listener } from "./index.ts";

/**
 * Handle updating the chat pins log if open
 */
const DeleteChatMessage: Listener = {
    listen(): void {
        Hooks.on("deleteChatMessage", (m, _data, _userId) => {
            const message = m as ChatMessage;
            const app = findChatPinsLogApp();

            if (!app) return;

            app.deleteMessage(message.id);
        });
    },
};

export { DeleteChatMessage };
