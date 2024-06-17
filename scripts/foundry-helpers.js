export default class FoundryHelpers {
    findChatPinsLogApp() {
        const openApps = Object.values(ui.windows);
        const chatPinsLog = openApps.find(
            (app) => app.options.id === "chat-pins",
        );

        return chatPinsLog;
    }
}
