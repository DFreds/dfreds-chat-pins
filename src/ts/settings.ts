import { MODULE_ID } from "./constants.ts";

const NO_ONE_ROLE = CONST.USER_ROLES.GAMEMASTER + 1;

class Settings {
    // Settings keys
    #PIN_PERMISSION = "pinPermission";

    register(): void {
        this.#registerPinPermission();
    }

    #registerPinPermission(): void {
        game.settings.register(MODULE_ID, this.#PIN_PERMISSION, {
            name: "ChatPins.Setting.PinPermissionName",
            hint: "ChatPins.Setting.PinPermissionHint",
            scope: "world",
            config: true,
            default: CONST.USER_ROLES.GAMEMASTER,
            choices: {
                [CONST.USER_ROLES.PLAYER]: game.i18n.localize("ChatPins.Setting.Player"),
                [CONST.USER_ROLES.TRUSTED]: game.i18n.localize("ChatPins.Setting.TrustedPlayer"),
                [CONST.USER_ROLES.ASSISTANT]: game.i18n.localize("ChatPins.Setting.AssistantGM"),
                [CONST.USER_ROLES.GAMEMASTER]: game.i18n.localize("ChatPins.Setting.GameMaster"),
                [NO_ONE_ROLE]: game.i18n.localize("ChatPins.Setting.None"),
            },
            type: String,
        });
    }

    get pinPermission(): number {
        return game.settings.get(MODULE_ID, this.#PIN_PERMISSION) as unknown as number;
    }
}

export { Settings };
