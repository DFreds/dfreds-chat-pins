import { Listener } from "./index.ts";
import { Settings } from "../settings.ts";

const Init: Listener = {
    listen(): void {
        Hooks.once("init", () => {
            new Settings().register();
        });
    },
};

export { Init };
