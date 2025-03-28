import { Listener } from "./index.ts";

const Setup: Listener = {
    listen(): void {
        Hooks.once("setup", () => {
            if (BUILD_MODE === "development") {
                // Setup debug mode
                CONFIG.debug.hooks = true;
            }
        });
    },
};

export { Setup };
