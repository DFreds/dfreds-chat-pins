import { ChatPinsLogV2 } from "../chat-pins-log-v2.ts";
import { FLUSH_OPTION, MODULE_ID } from "../constants.ts";
import { Listener } from "./index.ts";

const rebuildCoreChatLog = foundry.utils.debounce(async () => {
    if (!ui.chat.rendered) return;

    const remainingRows = () =>
        ui.chat.element.querySelectorAll<HTMLElement>(".message[data-message-id]:not(.deleting)");
    const ids = new Set(Array.from(remainingRows(), (row) => row.dataset.messageId ?? ""));
    await Promise.all(Array.from(ids, (id) => ui.chat.deleteMessage(id, { deleteAll: true })));
    for (const duplicateRow of remainingRows()) duplicateRow.remove();

    const batchSize = CONFIG.ChatMessage.batchSize;
    await ui.chat.renderBatch(batchSize);
    if (ui.chat.popout?.rendered) await ui.chat.popout.renderBatch(batchSize);
}, 100);

/**
 * Handle updating the chat pins log if open, and rebuilding the chat log after a pins-only flush
 */
const DeleteChatMessage: Listener = {
    listen(): void {
        Hooks.on("deleteChatMessage", (m, options, _userId) => {
            const isPinsOnlyFlush = foundry.utils.getProperty(options ?? {}, `${MODULE_ID}.${FLUSH_OPTION}`) === true;
            if (isPinsOnlyFlush) rebuildCoreChatLog();

            const message = m as ChatMessage;
            const app = foundry.applications.instances.get("chat-pins") as ChatPinsLogV2 | undefined;

            if (!app) return;

            app.deleteMessage(message.id);
        });
    },
};

export { DeleteChatMessage };
