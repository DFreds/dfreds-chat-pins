import { findChatPinsLogApp } from "../foundry-helpers.ts";
import { Listener } from "./index.ts";

/**
 * Handle updating the chat pins log if open
 */
const DeleteChatMessage: Listener = {
    listen(): void {
        Hooks.on("deleteChatMessage", (m: any, _data: any, _userId: any) => {
            const message = m as ChatMessage;
            const app = findChatPinsLogApp();

            if (!app) return;

            app.deleteMessage(message.id);
        });
    },
};

export { DeleteChatMessage };
