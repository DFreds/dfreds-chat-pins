# DFreds Chat Pins

[![Become a patron](https://github.com/codebard/patron-button-and-widgets-by-codebard/blob/master/images/become_a_patron_button.png?raw=true)](https://www.patreon.com/dfreds)
<a href="https://www.buymeacoffee.com/dfreds" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

![Foundry Version](https://img.shields.io/badge/Foundry-v10-informational)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https://forge-vtt.com/api/bazaar/package/dfreds-chat-pins&colorB=4aa94a)
![Latest Release Download Count](https://img.shields.io/github/downloads/dfreds/dfreds-chat-pins/latest/dfreds-chat-pins.zip)
![All Downloads](https://img.shields.io/github/downloads/dfreds/dfreds-chat-pins/total)

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
