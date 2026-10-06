import { ChatPins } from "../chat-pins.ts";
import { Listener } from "./index.ts";

/**
 * Handle modifying chat message when rendered to indicate pin status
 */
const RenderChatMessageHTML: Listener = {
    listen(): void {
        Hooks.on("renderChatMessageHTML", (m, html, _data) => {
            const message = m as ChatMessage;
            const element = html as unknown as HTMLElement;
            const chatPins = new ChatPins();

            if (chatPins.isPinned(message)) {
                const pinnedBy = game.i18n.localize("ChatPins.PinnedBy", {
                    pinner: chatPins.pinner(message),
                });

                element.style.border = "2px solid #ff6400";
                element.querySelector(".message-header")?.insertAdjacentHTML("afterend", `<p>${pinnedBy}</p>`);
            } else {
                element.style.border = "";
            }
        });
    },
};

export { RenderChatMessageHTML };
