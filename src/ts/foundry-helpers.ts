import { ChatPinsLog } from "./chat-pins-log.ts";

function findChatPinsLogApp(): ChatPinsLog | undefined {
    const openApps = Object.values(ui.windows);
    const chatPinsLog = openApps.find((app) => app.options.id === "chat-pins");

    if (!chatPinsLog) return undefined;

    return chatPinsLog as ChatPinsLog;
}

export { findChatPinsLogApp };
