import { ChatPins } from "../chat-pins.ts";
import { ChatLog } from "@client/applications/sidebar/tabs/_module.mjs";

/**
 * Handle adding pin button to chat buttons
 */
const RenderChatInput = {
    listen(): void {
        Hooks.on("renderChatInput", (chatLog, _data, _metadata) => {
            const chatLogTyped = chatLog as ChatLog;

            const chatPins = new ChatPins();
            chatPins.addPinButton($(chatLogTyped.element));
        });
    },
};

export { RenderChatInput };
