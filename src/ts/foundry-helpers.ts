import { ChatPinsLogV2 } from "./chat-pins-log-v2.ts";

function findChatPinsLogApp(): ChatPinsLogV2 | undefined {
    const applications = foundry.applications.instances;

    // @ts-expect-error The types provided by pf2e think this is a number
    const chatPinsLog = applications.get("chat-pins");

    return chatPinsLog as ChatPinsLogV2 | undefined;
}

export { findChatPinsLogApp };
