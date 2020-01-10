import {
  BindingState,
  BindingActionTypes,
} from './bindings/types'
import {
  InputState,
  InputActionTypes,
} from './inputs/types'
import {
  MessageState,
  MessageActionTypes,
} from './messages/types'
import {
  ScreenState,
  ScreenActionTypes,
} from './screens/types'

export type State = {
  bindings: BindingState,
  inputs: InputState,
  messages: MessageState,
  screens: ScreenState,
  socket: SocketIOClient.Socket,
}

export type ActionTypes = BindingActionTypes | InputActionTypes | MessageActionTypes | ScreenActionTypes
