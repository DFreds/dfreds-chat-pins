# DFreds Chat Pins

[![alt-text](https://img.shields.io/badge/-Patreon-%23f96854?style=for-the-badge)](https://www.patreon.com/dfreds)
[![alt-text](https://img.shields.io/badge/-Buy%20Me%20A%20Coffee-%23ff813f?style=for-the-badge)](https://www.buymeacoffee.com/dfreds)
[![alt-text](https://img.shields.io/badge/-Discord-%235662f6?style=for-the-badge)](https://discord.gg/Wq8AEV9bWb)

![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/DFreds/dfreds-chat-pins/main/module.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=ff6400&style=for-the-badge)

[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https://forge-vtt.com/api/bazaar/package/dfreds-chat-pins&colorB=68a74f&style=for-the-badge)](https://forge-vtt.com/bazaar#package=dfreds-chat-pins)
![Latest Release Download Count](https://img.shields.io/github/downloads/DFreds/dfreds-chat-pins/latest/dfreds-chat-pins.zip?color=2b82fc&label=LATEST%20DOWNLOADS&style=for-the-badge)
![Total Download Count](https://img.shields.io/github/downloads/DFreds/dfreds-chat-pins/total?color=2b82fc&label=TOTAL%20DOWNLOADS&style=for-the-badge)

**DFreds Chat Pins** is a FoundryVTT module that allows pinning messages to the
chat.

## Let Me Sell You This

Have you ever wanted to save a specific message, but delete all those other
crappy ones? What if you want to refer to it later? That sounds like a lot of
scrolling. Lame.

## What This Module Does

This module allows you to right-click any message in the chat log and pin or
unpin it. This stops Foundry from deleting it when you flush the chat log.

Additionally, you can refer to any of the pinned messages using the handy Chat
Pin Log application by clicking the pin icon above the chat text box.
Right-clicking any of the pinned chats in this chat log will provide an
additional option to jump to it in the main chat log.

![Chat Pins](docs/chat-pins.png)

## Required Modules

- [libWrapper](https://foundryvtt.com/packages/lib-wrapper) by ruipin - A
  library that wraps core Foundry methods to make it easier for modules
  developers to do their thang. Note that if you for some reason don't want to
  install this, a shim will be used instead. You'll be pestered to install it
  though so... [just do it](https://www.youtube.com/watch?v=ZXsQAXx_ao0)
