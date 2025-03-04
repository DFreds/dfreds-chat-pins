import { DeleteChatMessage } from "./deleteChatMessage.ts";
import { GetChatLogEntryContext } from "./getChatLogEntryContext.ts";
import { Ready } from "./ready.ts";
import { RenderChatLog } from "./renderChatLog.ts";
import { RenderChatMessage } from "./renderChatMessage.ts";
import { UpdateChatMessage } from "./updateChatMessage.ts";

interface Listener {
    listen(): void;
}

const HooksChatPins = {
    listen(): void {
        const listeners: Listener[] = [
            Ready,
            RenderChatMessage,
            RenderChatLog,
            UpdateChatMessage,
            GetChatLogEntryContext,
            DeleteChatMessage,
        ];

        for (const listener of listeners) {
            listener.listen();
        }
    },
};

export { HooksChatPins };
export type { Listener };
