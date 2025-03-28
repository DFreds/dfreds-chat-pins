import { Init } from "./init.ts";
import { Ready } from "./ready.ts";
import { RenderChatLog } from "./renderChatLog.ts";
import { UpdateChatMessage } from "./updateChatMessage.ts";
import { DeleteChatMessage } from "./deleteChatMessage.ts";
import { GetChatMessageContextOptions } from "./getChatMessageContextOptions .ts";
import { RenderChatMessageHTML } from "./renderChatMessageHTML.ts";

interface Listener {
    listen(): void;
}

const HooksChatPins = {
    listen(): void {
        const listeners: Listener[] = [
            Init,
            Ready,
            RenderChatMessageHTML,
            RenderChatLog,
            UpdateChatMessage,
            GetChatMessageContextOptions,
            DeleteChatMessage,
        ];

        for (const listener of listeners) {
            listener.listen();
        }
    },
};

export { HooksChatPins };
export type { Listener };
