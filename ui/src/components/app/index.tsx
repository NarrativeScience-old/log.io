import React, { useEffect, useReducer } from 'react'
import { DispatchContext, StateContext } from '../../contexts'
import InputManager from '../inputs'
import reducer from '../../reducers'
import { State } from '../../reducers/types'
import { ScreenActions } from '../../reducers/screens/types'
import ScreenManager from '../screens'
import {
  registerNewInput,
  registerNewMessage,
  registerPing,
  registerRemoveInput,
} from '../../socket'

import './styles.scss'

interface AppProps {
  initialState: State,
  socket: SocketIOClient.Socket,
}

/**
 * App container component
 */
const App: React.FC<AppProps> = ({ initialState, socket }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Register socket listeners
  useEffect(() => registerNewInput(socket, dispatch), [dispatch, socket])
  useEffect(() => registerRemoveInput(socket, dispatch), [dispatch, socket])
  useEffect(() => registerPing(socket, dispatch), [dispatch, socket])
  useEffect(() => registerNewMessage(socket, dispatch), [dispatch, socket])

  // Create initial screen
  useEffect(() => dispatch({ type: ScreenActions.ADD_SCREEN }), [dispatch])

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>
        <div className="app">
          <div className="left-column">
            {state && <InputManager />}
          </div>
          <div className="right-column">
            {state && <ScreenManager />}
          </div>
        </div>
      </StateContext.Provider>
    </DispatchContext.Provider>
  )
}

export default App
