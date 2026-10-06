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

            if (!chatPins.isPinned(message)) return;

            const pinnedBy = game.i18n.localize("ChatPins.PinnedBy", {
                pinner: chatPins.pinner(message),
            });

            element.classList.add("chat-pins-pinned");
            element
                .querySelector(".message-header")
                ?.insertAdjacentHTML("afterend", `<p class="chat-pins-pinned-by">${pinnedBy}</p>`);
        });
    },
};

export { RenderChatMessageHTML };
