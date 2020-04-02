import BindingReducer, { initialBindingState } from './bindings'
import { BindingActionTypes } from './bindings/types'
import InputReducer, { initialInputState } from './inputs'
import MessageReducer, { initialMessageState } from './messages'
import { InputActionTypes } from './inputs/types'
import { MessageActionTypes } from './messages/types'
import socketMiddleware from '../middleware/socket'
import urlMiddleware from '../middleware/url'
import ScreenReducer, { initialScreenState } from './screens'
import { ScreenActionTypes } from './screens/types'
import { ActionTypes, State } from './types'

export const initializeState = (socket: SocketIOClient.Socket): State => ({
  bindings: initialBindingState,
  inputs: initialInputState,
  messages: initialMessageState,
  screens: initialScreenState,
  socket,
})

export const Reducer = (state: State, action: ActionTypes): State => {
  const { bindings, inputs, messages, screens, socket } = state
  const newState = {
    bindings: BindingReducer(bindings, inputs, (action as BindingActionTypes)),
    inputs: InputReducer(inputs, (action as InputActionTypes)),
    messages: MessageReducer(messages, bindings, (action as MessageActionTypes)),
    screens: ScreenReducer(screens, (action as ScreenActionTypes)),
    socket,
  }
  socketMiddleware(socket, newState, action)
  urlMiddleware(socket, newState, action)
  return newState
}

export default Reducer
