---
title: 'Reference'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 4
kind: reference
---

# Reference

## Type Aliases

| Type alias                                                                                          | Description                                                         |
| :-------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| [TinyEventDispatcher](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventdispatcher) | A record value which holds the listeners that will react to events. |
| [TinyEventListener](/projects/konkerdev-tiny-event-fp/reference/type-aliases/tinyeventlistener)     | Signature of an event listener function.                            |

## Functions

| Function                                                                                                     | Description                                                                         |
| :----------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| [addListener](/projects/konkerdev-tiny-event-fp/reference/functions/addlistener)                             | Add the given listener for the given event to the given `TinyEventDispatcher`.      |
| [addStarListener](/projects/konkerdev-tiny-event-fp/reference/functions/addstarlistener)                     | Add a wildcard listener for all possible events to the given `TinyEventDispatcher`. |
| [createTinyEventDispatcher](/projects/konkerdev-tiny-event-fp/reference/functions/createtinyeventdispatcher) | Create an empty `TinyEventDispatcher` value.                                        |
| [notify](/projects/konkerdev-tiny-event-fp/reference/functions/notify)                                       | Notify all relevant listeners of the given event with the given event data.         |
| [removeAllListeners](/projects/konkerdev-tiny-event-fp/reference/functions/removealllisteners)               | Remove all listeners from the given `TinyEventDispatcher`.                          |
| [removeListener](/projects/konkerdev-tiny-event-fp/reference/functions/removelistener)                       | Remove the given listener for the given event from the given `TinyEventDispatcher`. |
| [removeStarListener](/projects/konkerdev-tiny-event-fp/reference/functions/removestarlistener)               | Remove the given wildcard listener from the given `TinyEventDispatcher`.            |
