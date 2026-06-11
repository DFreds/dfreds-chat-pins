import { Listener } from "./index.ts";
import { initSockets } from "../sockets/sockets.ts";

const SocketlibReady: Listener = {
    listen(): void {
        Hooks.once("socketlib.ready", () => {
            initSockets();
        });
    },
};

export { SocketlibReady };
