import { MessageActions, MessageState, MessageActionTypes } from './types'

import { BindingState } from '../bindings/types'

export const initialMessageState: MessageState = {
  screens: {},
}

const MAX_MESSAGES = 10000

/**
 * Manages application state for messages sent from the server
 */
export const MessageReducer = (
  state: MessageState,
  bindings: BindingState,
  action: MessageActionTypes
): MessageState => {
  const { screens } = state
  switch (action.type) {
    // A new message has been sent from the server
    case MessageActions.ADD_MESSAGE: {
      const { inputName, msg } = action
      const updatedScreens = { ...screens }
      const screenBindings = bindings.inputs[inputName] || {}
      Object.keys(screenBindings).forEach((screenId) => {
        if (screenBindings[screenId]) {
          const [stream, source] = inputName.split('|')
          const message = `[${stream}] [${source}] - ${msg}`
          let updatedMessages = (screens[screenId] || []).concat([message])
          // Avoid slicing the array on every single update, slice() is expensive.
          // Allow array to grow beyond the limit by a percentage, then slice.
          if (updatedMessages.length > MAX_MESSAGES + Math.floor(MAX_MESSAGES * 0.02)) {
            updatedMessages = updatedMessages.slice(-MAX_MESSAGES)
          }
          updatedScreens[screenId] = updatedMessages
        }
      })
      return { screens: updatedScreens }
    }
    // Remove all messages from screen
    case MessageActions.CLEAR_MESSAGES: {
      return {
        screens: {
          ...screens,
          [action.screenId]: [],
        },
      }
    }
    default:
      return state
  }
}

export default MessageReducer
