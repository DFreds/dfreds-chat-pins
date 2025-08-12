import { Init } from "./init.ts";
import { Ready } from "./ready.ts";
import { RenderChatInput } from "./renderChatInput.ts";
import { UpdateChatMessage } from "./updateChatMessage.ts";
import { DeleteChatMessage } from "./deleteChatMessage.ts";
import { Setup } from "./setup.ts";
import { GetChatMessageContextOptions } from "./getChatMessageContextOptions .ts";
import { RenderChatMessageHTML } from "./renderChatMessageHTML.ts";

interface Listener {
    listen(): void;
}

const HooksChatPins = {
    listen(): void {
        const listeners: Listener[] = [
            Init,
            Setup,
            Ready,
            RenderChatMessageHTML,
            RenderChatInput,
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
