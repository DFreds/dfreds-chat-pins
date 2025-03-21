import { ChatPins } from "../chat-pins.ts";
import { Listener } from "./index.ts";

/**
 * Handle modifying chat message when rendered to indicate pin status
 */
const RenderChatMessage: Listener = {
    listen(): void {
        Hooks.on("renderChatMessage", (message, $html, _data) => {
            const chatPins = new ChatPins();

            if (chatPins.isPinned(message)) {
                const pinnedBy = game.i18n.format("ChatPins.PinnedBy", {
                    pinner: chatPins.pinner(message),
                });
                const pinnedByHtml = $(`<p>${pinnedBy}</p>`);

                $html.css("border", "2px solid #ff6400");
                const messageHeader = $html.find(".message-header");
                pinnedByHtml.insertAfter(messageHeader);
            } else {
                $html.css("border", "");
            }
        });
    },
};

export { RenderChatMessage };
