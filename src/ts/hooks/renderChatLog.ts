import { ChatPins } from "../chat-pins.ts";

/**
 * Handle adding pin button to chat buttons
 */
const RenderChatLog = {
    listen(): void {
        Hooks.on("renderChatLog", (_chatLogApp, html, _data) => {
            const chatPins = new ChatPins();
            chatPins.addPinButton($(html));
        });
    },
};

export { RenderChatLog };
