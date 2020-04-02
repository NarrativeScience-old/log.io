import React, { Dispatch, useContext, useEffect, useMemo, useState } from 'react'
import { DebounceInput } from 'react-debounce-input'

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

interface ScreenMessageProps {
  message: string,
  messageFilter: string,
}

/**
 * Search a string for filter substring matches.
 * Returns a list of parts w/ highlight flag.
 */
const _parseMessageParts = (str: string, find: string) => {
  const parts = []
  let counter = 0
  let lastMatchIndex = 0
  const lowerStr = str.toLowerCase()
  const lowerFind = find.toLowerCase()
  while (counter < str.length) {
    const end = counter + find.length
    if (lowerStr.substring(counter, end) === lowerFind) {
      parts.push({ highlight: false, text: str.slice(lastMatchIndex, counter)})
      parts.push({ highlight: true, text: str.slice(counter, end)})
      counter = end
      lastMatchIndex = end
    }
    counter += 1
  }
  parts.push({ highlight: false, text: str.slice(lastMatchIndex, str.length)})
  return parts
}

/**
 * Renders a single message
 */
const ScreenMessage: React.FC<ScreenMessageProps> = ({
  message,
  messageFilter
}) => {
  return (
    <div>
      {messageFilter && _parseMessageParts(message, messageFilter).map((part, i) =>
        <span key={i} className={part.highlight ? 'highlight' : ''}>{part.text}</span>
      )}
      {!messageFilter && message}
    </div>
  )
}

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
  const [ messageFilter, setMessageFilter ] = useState('')
  const [ validMessages, setValidMessages ] = useState(messages)
  // Filter validMessages using messageFilter
  useEffect(() => {
    setValidMessages(
      messages.filter((msg) =>
        messageFilter === ''
          ? true
          : msg.toLowerCase().includes(messageFilter.toLowerCase()))
    )
  }, [messages, messageFilter])
  return (
    <>
      <div className="screen-header">
        <div className="title">
          Screen {screenIndex + 1}
        </div>
        <div className="controls">
          <DebounceInput
            minLength={2}
            debounceTimeout={200}
            placeholder="Filter"
            onChange={e => setMessageFilter(e.target.value)}
          />
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
          {validMessages.map((message, i) => (
            <ScreenMessage key={i} message={message} messageFilter={messageFilter} />
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
