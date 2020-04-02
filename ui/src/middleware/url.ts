import { BindingActions } from '../reducers/bindings/types'
import { ScreenActions } from '../reducers/screens/types'
import { ActionTypes, State } from '../reducers/types'

export type UrlBindingStateType = {
  [screenId: string]: Array<string>
}

/**
 * Update URL hash with binding state
 */
const urlMiddleware = (
  socket: SocketIOClient.Socket,
  state: State,
  action: ActionTypes
): void => {
  const { bindings } = state
  switch(action.type) {
    case BindingActions.BIND_STREAM_TO_SCREEN:
    case BindingActions.UNBIND_STREAM_FROM_SCREEN:
    case BindingActions.BIND_SOURCE_TO_SCREEN:
    case BindingActions.UNBIND_SOURCE_FROM_SCREEN:
    case BindingActions.BIND_INPUT_TO_SCREEN:
    case BindingActions.UNBIND_INPUT_FROM_SCREEN:
    case ScreenActions.REMOVE_SCREEN: {
      const urlBindingState: UrlBindingStateType = {}
      Object.keys(bindings.screens).forEach((screenId) => {
        urlBindingState[screenId] = Object.keys(bindings.screens[screenId].inputs)
          .filter((inputName) => bindings.screens[screenId].inputs[inputName])
      })
      window.location.hash = JSON.stringify(urlBindingState)
    }
  }
}

export default urlMiddleware
