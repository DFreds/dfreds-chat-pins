import moduleData from "@static/module.json" with { type: "json" };

export const MODULE_ID = moduleData.id;

/**
 * The flag, stored on a chat message, that holds the id of the user who pinned
 * it.
 */
export const PINNED_FLAG = "pinned";

/**
 * The option, passed on the delete operation of a pins-only flush, that tells
 * every client to rebuild its chat log afterward.
 */
export const FLUSH_OPTION = "flush";
