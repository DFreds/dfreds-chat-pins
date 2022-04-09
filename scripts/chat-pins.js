export default class ChatPins {
  // TODO do your own i18n
  deleteAllExceptPins(documentClass) {
    return Dialog.confirm({
      title: game.i18n.localize('CHAT.FlushTitle'),
      content: `<h4>${game.i18n.localize(
        'AreYouSure'
      )}</h4><p>${game.i18n.localize(
        'CHAT.FlushWarning'
      )}</p><p>Note that this will not delete any pinned messages.</p>`,
      yes: () => {
        const notPinnedIds = game.messages
          .filter((message) => !message.getFlag('dfreds-chat-pins', 'pinned'))
          .map((message) => message.id);

        documentClass.deleteDocuments(notPinnedIds);
      },
      options: {
        top: window.innerHeight - 175,
        left: window.innerWidth - 720,
      },
    });
  }
}
