import { ChatPins } from "../chat-pins.ts";
import { Listener } from "./index.ts";

/**
 * Handle adding pin button to chat buttons
 */
const RenderChatInput: Listener = {
    listen(): void {
        Hooks.on("renderChatInput", (_chatLog, elements, _metadata) => {
            const chatControls = (elements as Record<string, HTMLElement>)["#chat-controls"];
            if (!chatControls) return;

            new ChatPins().addPinButton(chatControls);
        });
    },
};

export { RenderChatInput };
