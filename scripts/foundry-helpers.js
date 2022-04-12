import ChatPinsLog from './chat-pins-log.js';

export default class FoundryHelpers {
  findChatPinsLogApp() {
    const openApps = Object.values(ui.windows);
    const chatPinsLog = openApps.find((app) => app instanceof ChatPinsLog);

    return chatPinsLog;
  }
}
