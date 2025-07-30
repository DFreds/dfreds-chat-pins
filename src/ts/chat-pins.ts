import { ChatPinsLogV2 } from "./chat-pins-log-v2.ts";
import { MODULE_ID } from "./constants.ts";

const { DialogV2 } = foundry.applications.api;

class ChatPins {
    #FLAG = "pinned";

    /**
     * Adds the pin button to the chat sidebar element
     *
     * @param chatHtml - the html for the chat sidebar
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

        const controlButtons = chatHtml.find(".chat-controls .control-buttons");

        if (controlButtons.length > 0) {
            controlButtons.prepend(pinButton);
        } else {
            // Chat controls > control-buttons are not present, so create them
            const chatControls = chatHtml.find(".chat-controls");
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
        return message.getFlag(MODULE_ID, this.#FLAG) !== undefined;
    }

    /**
     * Pins the given message
     *
     * @param message - the message to pin
     * @returns promise that resolves when the message flag is set
     */
    pin(message: ChatMessage): Promise<ChatMessage> {
        return message.setFlag(MODULE_ID, this.#FLAG, game.user.id);
    }

    /**
     * Unpins the given message
     *
     * @param message - the message to unpin
     * @returns promise that resolves when the message flag is unset
     */
    unpin(message: ChatMessage): Promise<ChatMessage | undefined> {
        return message.unsetFlag(MODULE_ID, this.#FLAG);
    }

    /**
     * Get the user who pinned the message
     *
     * @param message - the message to get the pinner of
     * @returns the name of the user who pinned the message
     */
    pinner(message: ChatMessage): string {
        const pinnerId = message.getFlag(MODULE_ID, this.#FLAG) as string;
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
                                !message.getFlag(MODULE_ID, this.#FLAG),
                        )
                        .map((message: ChatMessage) => message.id);

                    await ChatMessage.deleteDocuments(notPinnedIds);
                },
            },
        });
    }
}

export { ChatPins };
