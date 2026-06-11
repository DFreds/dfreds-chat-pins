import moduleData from "@static/module.json" with { type: "json" };

export const MODULE_ID = moduleData.id;

/**
 * The flag, stored on a chat message, that holds the id of the user who pinned
 * it.
 */
export const PINNED_FLAG = "pinned";
