import { libWrapper } from "@static/lib/shim.ts";
import { ChatPins } from "../chat-pins.ts";
import { MODULE_ID } from "../constants.ts";
import { Listener } from "./index.ts";
import Messages from "@client/documents/collections/chat-messages.mjs";

const Ready: Listener = {
    listen(): void {
        Hooks.once("ready", () => {
            /**
             * Overrides the standard flush so that pinned messages are not deleted
             */
            libWrapper.register(
                MODULE_ID,
                "foundry.documents.collections.ChatMessages.prototype.flush",
                function (this: Messages, _wrapper: any, ..._args: any) {
                    const chatPins = new ChatPins();
                    chatPins.deleteAllExceptPins();
                },
                "OVERRIDE",
            );
        });
    },
};

export { Ready };
