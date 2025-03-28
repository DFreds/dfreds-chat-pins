import { ChatPinsLogV2 } from "./chat-pins-log-v2.ts";
import { MODULE_ID } from "./constants.ts";

class ChatPins {
    #FLAG = "pinned";

    /**
     * Adds the pin button to the chat sidebar element
     *
     * @param chatHtml - the html for the chat sidebar
     */
    addPinButton(chatHtml: JQuery<HTMLElement>): void {
        const pinButton = $(
            `<button type="button" class="ui-control icon fa-solid fa-thumbtack" data-tooltip="ChatPins.ChatPins" aria-label="${game.i18n.localize("ChatPins.ChatPins")}" data-action="chat-pins"></button>`,
        );
        pinButton.on("click", async () => {
            console.log("clicked");
            new ChatPinsLogV2().render(true);
        });

        const controlButtons = chatHtml.find(".chat-controls .control-buttons");
        controlButtons.prepend(pinButton);
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
        // @ts-expect-error It wants a bunch of "Required" params in the options, but you don't actually need them
        return Dialog.confirm({
            title: game.i18n.localize("CHAT.FlushTitle"),
            content: `
            <h4>${game.i18n.localize("AreYouSure")}</h4>
            <p>${game.i18n.localize("CHAT.FlushWarning")}</p>
            <p>${game.i18n.localize("ChatPins.DeleteAllNote")}</p>`,
            yes: async () => {
                const notPinnedIds = game.messages
                    .filter(
                        (message) => !message.getFlag(MODULE_ID, this.#FLAG),
                    )
                    .map((message) => message.id);

                await ChatMessage.deleteDocuments(notPinnedIds);
            },
            options: {
                top: window.innerHeight - 175,
                left: window.innerWidth - 720,
            },
        });
    }
}

export { ChatPins };
