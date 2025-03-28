import { ChatPins } from "../chat-pins.ts";
import { Listener } from "./index.ts";

/**
 * Handle modifying chat message when rendered to indicate pin status
 */
const RenderChatMessageHTML: Listener = {
    listen(): void {
        Hooks.on(
            "renderChatMessageHTML",
            (message: any, html: any, _data: any) => {
                const chatPins = new ChatPins();
                const $html = $(html);

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
            },
        );
    },
};

export { RenderChatMessageHTML };
