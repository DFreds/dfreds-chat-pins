import { ChatPinsLogV2 } from "../chat-pins-log-v2.ts";
import { Listener } from "./index.ts";

/**
 * Handle updating the chat pins log if open
 */
const DeleteChatMessage: Listener = {
    listen(): void {
        Hooks.on("deleteChatMessage", (m, _data, _userId) => {
            const message = m as ChatMessage;
            const app = foundry.applications.instances.get("chat-pins") as ChatPinsLogV2 | undefined;

            if (!app) return;

            app.deleteMessage(message.id);
        });
    },
};

export { DeleteChatMessage };
