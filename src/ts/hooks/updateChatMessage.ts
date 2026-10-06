import { ChatPins } from "../chat-pins.ts";
import { ChatPinsLogV2 } from "../chat-pins-log-v2.ts";
import { Listener } from "./index.ts";

/**
 * Handle updating the chat pins log if open
 */
const UpdateChatMessage: Listener = {
    listen(): void {
        Hooks.on("updateChatMessage", (m, _update, _data) => {
            const message = m as ChatMessage;
            const chatPins = new ChatPins();
            const app = foundry.applications.instances.get("chat-pins") as ChatPinsLogV2 | undefined;

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
