import { MODULE_ID } from "./constants.ts";

class Settings {
    #USER_ROLES: Record<number, string> = {};

    // Settings keys
    #PIN_PERMISSION = "pinPermission";

    constructor() {
        this.#USER_ROLES[CONST.USER_ROLES.PLAYER] = game.i18n.localize(
            "ChatPins.Setting.Player",
        );
        this.#USER_ROLES[CONST.USER_ROLES.TRUSTED] = game.i18n.localize(
            "ChatPins.Setting.TrustedPlayer",
        );
        this.#USER_ROLES[CONST.USER_ROLES.ASSISTANT] = game.i18n.localize(
            "ChatPins.Setting.AssistantGM",
        );
        this.#USER_ROLES[CONST.USER_ROLES.GAMEMASTER] = game.i18n.localize(
            "ChatPins.Setting.GameMaster",
        );
        this.#USER_ROLES[5] = game.i18n.localize("ChatPins.Setting.None");
    }

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
            choices: this.#USER_ROLES,
            type: String,
        });
    }

    get pinPermission(): number {
        return game.settings.get(MODULE_ID, this.#PIN_PERMISSION) as number;
    }
}

export { Settings };
