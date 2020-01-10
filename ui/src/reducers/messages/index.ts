import { MessageActions, MessageState, MessageActionTypes } from './types'

import { BindingState } from '../bindings/types'

export const initialMessageState: MessageState = {
  screens: {},
}

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
          updatedScreens[screenId] = (screens[screenId] || []).concat([message])
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
