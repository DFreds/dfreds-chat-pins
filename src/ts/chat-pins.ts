import { ChatPinsLogV2 } from "./chat-pins-log-v2.ts";
import { MODULE_ID, PINNED_FLAG } from "./constants.ts";
import { Settings } from "./settings.ts";
import { getSockets } from "./sockets/sockets.ts";

const { DialogV2 } = foundry.applications.api;

class ChatPins {
    /**
     * Adds the pin button to the chat sidebar element
     *
     * @param chatHtml - the html for the chat input
     */
    addPinButton(chatHtml: JQuery<HTMLElement>): void {
        // Check if pin button already exists
        if (chatHtml.find('button[data-action="chat-pins"]').length > 0) {
            return;
        }

        const pinButton = $(
            `<button type="button" class="ui-control icon fa-solid fa-thumbtack" data-tooltip="ChatPins.ChatPins" aria-label="${game.i18n.localize("ChatPins.ChatPins")}" data-action="chat-pins"></button>`,
        );
        pinButton.on("click", async () => {
            console.log("clicked");
            new ChatPinsLogV2().render(true);
        });

        const controlButtons = chatHtml.find("#chat-controls .control-buttons");

        if (controlButtons.length > 0) {
            controlButtons.prepend(pinButton);
        } else {
            // Chat controls > control-buttons are not present, so create them
            const chatControls = chatHtml.find("#chat-controls");
            const controlButtonsDiv = $('<div class="control-buttons"></div>');
            chatControls.append(controlButtonsDiv);
            controlButtonsDiv.append(pinButton);
        }
    }

    /**
     * Checks if a given message is pinned
     *
     * @param message - the message to check if pinned
     * @returns true if the message is pinned
     */
    isPinned(message: ChatMessage): boolean {
        return message.getFlag(MODULE_ID, PINNED_FLAG) !== undefined;
    }

    /**
     * Determines whether the current user is allowed to pin or unpin the given
     * message.
     *
     * When socketlib is available, the pin/unpin is performed by a connected
     * GM, so any user that meets the configured permission role can modify any
     * message. When socketlib is unavailable, the user must additionally own
     * the message in order to change its flags directly.
     *
     * @param message - the message to check
     * @returns true if the current user can pin or unpin the message
     */
    canModify(message: ChatMessage): boolean {
        const hasPermission = game.user.role >= new Settings().pinPermission;
        if (!hasPermission) return false;

        if (getSockets()) return true;

        return message.testUserPermission(
            game.user,
            CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
        );
    }

    /**
     * Pins the given message.
     *
     * When socketlib is available, the request is routed through a connected GM
     * so that any permitted user can pin a message they do not own. Otherwise,
     * the flag is set directly, which requires the user to own the message.
     *
     * @param message - the message to pin
     * @returns promise that resolves when the request has been handled
     */
    async pin(message: ChatMessage): Promise<void> {
        const sockets = getSockets();

        if (!sockets) {
            await message.setFlag(MODULE_ID, PINNED_FLAG, game.user.id);
            return;
        }

        if (!this.#requireActiveGm()) return;

        await sockets.emitPin({
            messageId: message.id,
            userId: game.user.id,
        });
    }

    /**
     * Unpins the given message.
     *
     * When socketlib is available, the request is routed through a connected GM
     * so that any permitted user can unpin a message they do not own.
     * Otherwise, the flag is unset directly, which requires the user to own the
     * message.
     *
     * @param message - the message to unpin
     * @returns promise that resolves when the request has been handled
     */
    async unpin(message: ChatMessage): Promise<void> {
        const sockets = getSockets();

        if (!sockets) {
            await message.unsetFlag(MODULE_ID, PINNED_FLAG);
            return;
        }

        if (!this.#requireActiveGm()) return;

        await sockets.emitUnpin({
            messageId: message.id,
            userId: game.user.id,
        });
    }

    /**
     * Ensures a GM is connected to handle the socketed pin/unpin request,
     * warning the user if not.
     *
     * @returns true if an active GM is connected
     */
    #requireActiveGm(): boolean {
        if (!game.users.activeGM) {
            ui.notifications.warn(game.i18n.localize("ChatPins.NoGmConnected"));
            return false;
        }

        return true;
    }

    /**
     * Get the user who pinned the message
     *
     * @param message - the message to get the pinner of
     * @returns the name of the user who pinned the message
     */
    pinner(message: ChatMessage): string {
        const pinnerId = message.getFlag(MODULE_ID, PINNED_FLAG) as string;
        return (
            game.users.get(pinnerId)?.name ??
            game.i18n.localize("ChatPins.Unknown")
        );
    }

    /**
     * Prompts to delete all messages from the chat log except pins.
     *
     * NOTE: Taken from Messages.flush in base foundry code and added the filter.
     *
     * @returns a promise that resolves when the dialog is finished
     */
    deleteAllExceptPins(): Promise<any> {
        const question = game.i18n.localize("AreYouSure");
        const warning = game.i18n.localize("CHAT.FlushWarning");
        const deleteAllNote = game.i18n.localize("ChatPins.DeleteAllNote");

        return DialogV2.confirm({
            window: { title: "CHAT.FlushTitle", controls: [] },
            content: `<p><strong>${question}</strong> ${warning}</p><p>${deleteAllNote}</p>`,
            position: {
                top: window.innerHeight - 150,
                left: window.innerWidth - 720,
            },
            yes: {
                callback: async () => {
                    const jumpToBottomElement =
                        document.querySelector(".jump-to-bottom");
                    if (jumpToBottomElement) {
                        (jumpToBottomElement as HTMLElement).hidden = true;
                    }

                    const notPinnedIds = game.messages
                        .filter(
                            (message: ChatMessage) =>
                                !message.getFlag(MODULE_ID, PINNED_FLAG),
                        )
                        .map((message: ChatMessage) => message.id);

                    await ChatMessage.deleteDocuments(notPinnedIds);
                },
            },
        });
    }
}

export { ChatPins };
