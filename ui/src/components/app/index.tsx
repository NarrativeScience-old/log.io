import React, { useEffect, useReducer } from 'react'
import initializeState from './initialize'
import { DispatchContext, StateContext } from '../../contexts'
import InputManager from '../inputs'
import reducer from '../../reducers'
import { State } from '../../reducers/types'
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

  // Initialize screens & bindings from URL
  useEffect(() => initializeState(dispatch, window.location.hash), [dispatch, socket])

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
