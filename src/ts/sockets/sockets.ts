import { MODULE_ID, PINNED_FLAG } from "../constants.ts";
import { Settings } from "../settings.ts";
import { log } from "../logger.ts";

interface PinMessageData {
    /**
     * The id of the message to pin or unpin
     */
    messageId: string;

    /**
     * The id of the user who requested the pin or unpin
     */
    userId: string;
}

class Sockets {
    #socket: SocketlibSocket;
    #settings: Settings;

    constructor() {
        this.#settings = new Settings();
        this.#socket = socketlib.registerModule(MODULE_ID);
        this.#socket.register("pin", this.#onPin.bind(this));
        this.#socket.register("unpin", this.#onUnpin.bind(this));
    }

    async emitPin(message: PinMessageData): Promise<void> {
        await this.#socket.executeAsGM("pin", message);
    }

    async #onPin({ messageId, userId }: PinMessageData): Promise<void> {
        if (!this.#canUserPin(userId)) return;

        const message = game.messages.get(messageId);
        if (!message) return;

        await message.setFlag(MODULE_ID, PINNED_FLAG, userId);

        log(`Pinned message ${messageId} on behalf of user ${userId}`);
    }

    async emitUnpin(message: PinMessageData): Promise<void> {
        await this.#socket.executeAsGM("unpin", message);
    }

    async #onUnpin({ messageId, userId }: PinMessageData): Promise<void> {
        if (!this.#canUserPin(userId)) return;

        const message = game.messages.get(messageId);
        if (!message) return;

        await message.unsetFlag(MODULE_ID, PINNED_FLAG);

        log(`Unpinned message ${messageId} on behalf of user ${userId}`);
    }

    /**
     * Validates, on the GM, that the requesting user is actually allowed to pin
     * messages. This prevents the client-side permission check from being
     * bypassed.
     *
     * @param userId - the id of the user requesting the pin or unpin
     * @returns true if the user is allowed to pin messages
     */
    #canUserPin(userId: string): boolean {
        const user = game.users.get(userId);
        if (!user) return false;

        const hasPermission = user.role >= this.#settings.pinPermission;
        if (!hasPermission) {
            log(
                `User ${userId} does not have permission to pin messages and was rejected`,
            );
        }

        return hasPermission;
    }
}

let sockets: Sockets | undefined;

/**
 * Initializes the module socket. Must be called after socketlib is ready.
 *
 * @returns the initialized sockets instance
 */
function initSockets(): Sockets {
    sockets = new Sockets();
    return sockets;
}

/**
 * Gets the initialized sockets instance, if any.
 *
 * @returns the sockets instance or undefined if not yet initialized
 */
function getSockets(): Sockets | undefined {
    return sockets;
}

export { Sockets, initSockets, getSockets };
export type { PinMessageData };
