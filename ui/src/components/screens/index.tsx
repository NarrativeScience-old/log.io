import React, { Dispatch, useContext, useMemo } from 'react'
import { DispatchContext, StateContext } from '../../contexts'
import { ActionTypes, State } from '../../reducers/types'
import { MessageActions, MessageState } from '../../reducers/messages/types'
import { ScreenActions, Screen as ScreenType, ScreenState } from '../../reducers/screens/types'

import './styles.scss'

interface ScreenManagerProps {
  addScreen: () => void,
  clearMessages: (screenId: string) => void,
  messages: MessageState,
  removeScreen: (screenId: string) => void,
  screens: ScreenState,
}

interface MappedScreenManagerProps {
  dispatch: Dispatch<ActionTypes>,
  state: State,
}

interface ScreenProps {
  clearMessages: (screenId: string) => void,
  screen: ScreenType,
  screenIndex: number,
  messages: Array<string>,
  removeScreen: (screenId: string) => void,
}

const MAX_LOGS = 5000

/**
 * Renders a single screen
 */
const Screen: React.FC<ScreenProps> = ({
  clearMessages,
  messages,
  removeScreen,
  screen,
  screenIndex
}) => {
  const validMessages = messages.slice(-MAX_LOGS)
  return (
    <>
      <div className="screen-header">
        <div className="title">
          Screen {screenIndex + 1}
        </div>
        <div className="controls">
          <button onClick={() => clearMessages(screen.id)}>
            Clear
          </button>
          <button onClick={() => removeScreen(screen.id)}>
            Close
          </button>
        </div>
      </div>
      <div className="screen" data-testid={`screen-${screenIndex}`}>
        <div className="screen-messages">
          {(validMessages).map((message, i) => (
            <div key={i}>
              {message}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/**
 * Render all screens & screen controls
 */
const ScreenManager: React.FC<ScreenManagerProps> = ({
  addScreen,
  clearMessages,
  messages,
  removeScreen,
  screens
}) => {
  const screenIds = Object.keys(screens.screens)
  return (
    <div className="screens">
      {screenIds.map((screenId, i) => (
        <Screen
          key={screenId}
          clearMessages={clearMessages}
          removeScreen={removeScreen}
          screen={screens.screens[screenId]}
          screenIndex={i}
          messages={messages.screens[screenId] || []}
        />
      ))}
      <div className="screens-controls">
        {screenIds.length < 6 && (
          <button
            data-testid="add-screen-btn"
            className="add-screen-btn"
            onClick={addScreen}
          >
            &#65291; Add Screen
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Creates handler functions from app state
 */
const MappedScreenManager: React.FC<MappedScreenManagerProps> = ({ dispatch, state }) => {
  const { messages, screens } = state

  // Create click handler functions to add/remove screens
  const addScreen = useMemo(() => (
    () => { dispatch({ type: ScreenActions.ADD_SCREEN }) }
  ), [dispatch])

  // Create click handler to remove a screen.
  const removeScreen = useMemo(() => (
    (screenId: string) => { dispatch({ type: ScreenActions.REMOVE_SCREEN, screenId }) }
  ), [dispatch])

  const clearMessages = useMemo(() => (
    (screenId: string) => { dispatch({ type: MessageActions.CLEAR_MESSAGES, screenId }) }
  ), [dispatch])

  return ScreenManager({ addScreen, clearMessages, messages, removeScreen, screens })
}

/**
 * Connects component to app contexts
 */
const ConnectedScreenManager: React.FC = () => {
  const state: State | null = useContext(StateContext)
  const dispatch: Dispatch<ActionTypes> | null = useContext(DispatchContext)
  if (!state || !dispatch) {
    return null
  }
  return MappedScreenManager({ dispatch, state })
}

export default ConnectedScreenManager
