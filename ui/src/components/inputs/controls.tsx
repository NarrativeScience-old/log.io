import React, { Dispatch, useContext, useMemo } from 'react'
import { DispatchContext } from '../../contexts'
import { BindingActions } from '../../reducers/bindings/types'
import { ScreenState } from '../../reducers/screens/types'
import { StateContext } from '../../contexts'
import { State } from '../../reducers/types'
import { Input } from '../../reducers/inputs/types'
import { ActionTypes } from '../../reducers/types'
import { getDiodeClass } from './util'

import './styles.scss'

type GroupTypes = 'streams' | 'sources'

interface InputControlsProps {
  input: Input,
  isBound: (inputName: string, screenId: string) => boolean,
  labelName: string,
  screens: ScreenState,
  toggleInputBinding: (
    inputName: string,
    stream: string,
    source: string,
    screenId: string
  ) => void,
}

interface MappedInputControls {
  dispatch: Dispatch<ActionTypes>,
  input: Input,
  labelName: string,
  state: State,
}

interface ConnectedInputControlsProps {
  input: Input,
  labelName: string,
}

/**
 * Show a single input and its corresponding screen binding controls
 */
const InputControls: React.FC<InputControlsProps> = ({
  input,
  isBound,
  labelName,
  screens,
  toggleInputBinding,
}) => {
  const inputName = input.name
  const diodeClass = getDiodeClass(input.ping)
  return (
    <div className="input">
      <div className={`diode ${diodeClass}`}/>
      <label>{labelName}</label>
      {Object.keys(screens.screens).map((screenId, i) => (
        <input
          key={screenId}
          title={`Screen ${i + 1}`}
          data-testid={`input-control-${inputName}:${i}`}
          type="checkbox"
          checked={isBound(inputName, screenId)}
          onChange={() => toggleInputBinding(
            inputName,
            input.stream,
            input.source,
            screenId
          )}
        />
      ))}
    </div>
  )
}

/**
 * Creates handler functions from app state
 */
const MappedInputControls: React.FC<MappedInputControls> = ({
  dispatch,
  input,
  labelName,
  state
}) => {
  const { bindings, screens } = state

  // Create helper function to determine if input is bound
  const isBound = useMemo(() => (
    (inputName: string, screenId: string): boolean => (
      !!bindings.inputs[inputName] && !!bindings.inputs[inputName][screenId]
    )
  ), [bindings])

  // Create function to update app state & notify server on input binding change
  const toggleInputBinding = useMemo(() => (
    (inputName: string, stream: string, source: string, screenId: string): void => {
      if (isBound(inputName, screenId)) {
        dispatch({
          type: BindingActions.UNBIND_INPUT_FROM_SCREEN,
          inputName,
          stream,
          source,
          screenId
        })
      } else {
        dispatch({
          type: BindingActions.BIND_INPUT_TO_SCREEN,
          inputName,
          stream,
          source,
          screenId
        })
      }
    }
  ), [dispatch, isBound])

  return InputControls({ input, isBound, labelName, screens, toggleInputBinding })
}


/**
 * Connects component to app contexts
 */
const ConnectedInputControls: React.FC<ConnectedInputControlsProps> = ({ input, labelName }) => {
  const dispatch: Dispatch<ActionTypes> | null = useContext(DispatchContext)
  const state: State | null = useContext(StateContext)
  if (!dispatch || !state) {
    return null
  }
  return MappedInputControls({ dispatch, input, labelName, state })
}

export default ConnectedInputControls
