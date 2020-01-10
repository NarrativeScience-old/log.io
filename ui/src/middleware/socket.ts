import { BindingActions } from '../reducers/bindings/types'
import { ScreenActions } from '../reducers/screens/types'
import { ActionTypes, State } from '../reducers/types'
import { sendBindInput, sendUnbindInput } from '../socket'

/**
 * Sends bind/unbind events to the server based on reducer actions
 * triggered by user actions
 */
const socketMiddleware = (
  socket: SocketIOClient.Socket,
  state: State,
  action: ActionTypes
): void => {
  const { bindings, inputs } = state
  switch(action.type) {
    case BindingActions.BIND_STREAM_TO_SCREEN: {
      // Tell server to start sending messages for all inputs in this stream.
      // Server treats it as a noop if it's already sending input messages
      Object.keys(inputs.streams[action.stream].pairs).forEach((source) => {
        sendBindInput(socket, inputs.streams[action.stream].pairs[source])
      })
      break
    }
    case BindingActions.UNBIND_STREAM_FROM_SCREEN: {
      // Tell server to stop sending messages for any of this stream's inputs
      // that are no longer bound to a screen
      Object.keys(inputs.streams[action.stream].pairs).forEach((source) => {
        const inputName = inputs.streams[action.stream].pairs[source]
        const boundToOtherScreens = Object.keys(bindings.inputs[inputName])
          .some((screenId) => bindings.inputs[inputName][screenId])
        if (!boundToOtherScreens) {
          sendUnbindInput(socket, inputName)
        }
      })
      break
    }
    case BindingActions.BIND_SOURCE_TO_SCREEN: {
      // Tell server to start sending messages for all inputs from this source.
      // Server treats it as a noop if it's already sending input messages
      Object.keys(inputs.sources[action.source].pairs).forEach((stream) => {
        sendBindInput(socket, inputs.sources[action.source].pairs[stream])
      })
      break
    }
    case BindingActions.UNBIND_SOURCE_FROM_SCREEN: {
      // Tell server to stop sending messages for any of this sources's inputs
      // that are no longer bound to a screen
      Object.keys(inputs.sources[action.source].pairs).forEach((stream) => {
        const inputName = inputs.sources[action.source].pairs[stream]
        const boundToOtherScreens = Object.keys(bindings.inputs[inputName])
          .some((screenId) => bindings.inputs[inputName][screenId])
        if (!boundToOtherScreens) {
          sendUnbindInput(socket, inputName)
        }
      })
      break
    }
    case BindingActions.BIND_INPUT_TO_SCREEN: {
      // Tell server to start sending messages for this input.
      // Server treats it as a noop if it's already sending input messages
      sendBindInput(socket, action.inputName)
      break
    }
    case BindingActions.UNBIND_INPUT_FROM_SCREEN: {
      // Tell server to stop sending messages for this input if it's not
      // bound to any other screens
      const boundToOtherScreens = Object.keys(bindings.inputs[action.inputName])
        .some((screenId) => bindings.inputs[action.inputName][screenId])
      if (!boundToOtherScreens) {
        sendUnbindInput(socket, action.inputName)
      }
      break
    }
    case ScreenActions.REMOVE_SCREEN: {
      // Tell server to stop sending messages for any of this screen's inputs
      // if it's not bound to any other screens
      if (!bindings.screens[action.screenId]) {
        return
      }
      Object.keys(bindings.screens[action.screenId].inputs).forEach((inputName) => {
        const boundToOtherScreens = Object.keys(bindings.inputs[inputName])
          .some((screenId) => bindings.inputs[inputName][screenId])
        if (!boundToOtherScreens) {
          sendUnbindInput(socket, inputName)
        }
      })
      break
    }
  }
}

export default socketMiddleware
