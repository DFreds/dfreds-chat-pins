import { Listener } from "./index.ts";
import { libWrapper } from "@static/lib/shim.ts";
import { ChatPins } from "../chat-pins.ts";
import { MODULE_ID } from "../constants.ts";

const Setup: Listener = {
    listen(): void {
        Hooks.once("setup", () => {
            if (BUILD_MODE === "development") {
                // Setup debug mode
                CONFIG.debug.hooks = true;
            }

            /**
             * Overrides the standard flush so that pinned messages are not deleted
             */
            libWrapper.register(
                MODULE_ID,
                "foundry.documents.collections.ChatMessages.prototype.flush",
                function (this: unknown, _wrapper: any, ..._args: any) {
                    return new ChatPins().deleteAllExceptPins();
                },
                "OVERRIDE",
            );
        });
    },
};

export { Setup };
