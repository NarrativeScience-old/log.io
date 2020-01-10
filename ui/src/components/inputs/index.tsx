import React, { Dispatch, useContext, useMemo, useState } from 'react'
import InputControls from './controls'
import { DispatchContext, StateContext } from '../../contexts'
import { BindingActions } from '../../reducers/bindings/types'
import { InputState } from '../../reducers/inputs/types'
import { ScreenState } from '../../reducers/screens/types'
import { ActionTypes, State } from '../../reducers/types'

import { getDiodeClass } from './util'
import './styles.scss'

type GroupTypes = 'streams' | 'sources'

interface InputGroupsProps {
  filter: string,
  groupType: GroupTypes,
  inputState: InputState,
  isBound: (groupType: GroupTypes, groupName: string, screenId: string) => boolean,
  screens: ScreenState,
  toggleBinding: (groupType: GroupTypes, groupName: string, screenId: string) => void,
}

interface InputManagerProps {
  inputs: InputState,
  isBound: (groupType: GroupTypes, groupName: string, screenId: string) => boolean,
  screens: ScreenState,
  toggleBinding: (groupType: GroupTypes, groupName: string, screenId: string) => void,
}

interface MappedInputManagerProps {
  dispatch: Dispatch<ActionTypes>,
  state: State,
}

const InputGroups: React.FC<InputGroupsProps> = ({
  filter,
  groupType,
  inputState,
  isBound,
  screens,
  toggleBinding
}) => {
  const groups = inputState[groupType]
  let displayGroups = Object.keys(groups).map((groupName) => ({
    name: groupName,
    group: groups[groupName]
  }))
  if (filter.trim() !== '') {
    displayGroups = displayGroups.filter(({ name }) =>
      name.toLowerCase().includes(filter.trim().toLowerCase()))
  }
  return (
    <div className="input-groups">
      {displayGroups.map(({ name, group }) => (
        <div className="input-group" key={name}>
          <div className="input-group-name">
            <div className={`diode ${getDiodeClass(group.ping)}`} />
            <label>{name}</label>
            <div className="screen-binding-controls">
              {Object.keys(screens.screens).map((screenId, i) => (
                <input
                  key={`${name}-${screenId}`}
                  title={`Screen ${i + 1}`}
                  data-testid={`group-control-${name}:${i}`}
                  type="checkbox"
                  checked={isBound(groupType, name, screenId)}
                  onChange={() => toggleBinding(groupType, name, screenId)}
                />
              ))}
            </div>
          </div>
          {Object.keys(groups[name].pairs).map((otherName) => (
            <InputControls
              key={inputState.inputs[groups[name].pairs[otherName]].name}
              input={inputState.inputs[groups[name].pairs[otherName]]}
              labelName={otherName}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Show all input names & controls
 */
const InputManager: React.FC<InputManagerProps> = ({
  inputs,
  isBound,
  screens,
  toggleBinding
}) => {
  const [activeInputGroup, setActiveInputGroup] = useState<GroupTypes>('streams')
  const [activeFilter, setActiveFilter] = useState('')
  return (
    <div className="input-manager">
      <div className="input-group-toggles">
        <div
          className={`input-group-toggle ${activeInputGroup === 'streams' ? 'active': ''}`}
          onClick={() => setActiveInputGroup('streams')}
        >
          Streams
        </div>
        <div
          className={`input-group-toggle ${activeInputGroup === 'sources' ? 'active': ''}`}
          onClick={() => setActiveInputGroup('sources')}
        >
          Sources
        </div>
      </div>
      <div className="input-filter">
        <input
          type="text"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          placeholder="Filter..."
        />
      </div>
      <InputGroups
        filter={activeFilter}
        groupType={activeInputGroup}
        inputState={inputs}
        isBound={isBound}
        screens={screens}
        toggleBinding={toggleBinding}
      />
    </div>
  )
}

/**
 * Creates handler functions from app state
 */
const MappedInputManager: React.FC<MappedInputManagerProps> = ({ dispatch, state }) => {
  const { bindings, inputs, screens } = state
  // Create helper function to determine if group is bound
  const isBound = useMemo(() => (
    (groupType: GroupTypes, groupName: string, screenId: string): boolean => (
      !!bindings[groupType][groupName] && !!bindings[groupType][groupName][screenId]
    )
  ), [bindings])

  // Create function to update app state & notify server on group binding change
  const toggleBinding = useMemo(() => (
    (groupType: GroupTypes, groupName: string, screenId: string): void => {
      switch (groupType) {
        case 'streams': {
          if (isBound(groupType, groupName, screenId)) {
            dispatch({
              type: BindingActions.UNBIND_STREAM_FROM_SCREEN,
              stream: groupName, screenId
            })
          } else {
            dispatch({
              type: BindingActions.BIND_STREAM_TO_SCREEN,
              stream: groupName, screenId
            })
          }
          break
        }
        case 'sources': {
          if (isBound(groupType, groupName, screenId)) {
            dispatch({
              type: BindingActions.UNBIND_SOURCE_FROM_SCREEN,
              source: groupName, screenId
            })
          } else {
            dispatch({
              type: BindingActions.BIND_SOURCE_TO_SCREEN,
              source: groupName, screenId
            })
          }
          break
        }
      }
    }
  ), [dispatch, isBound])
  return InputManager({ inputs, isBound, screens, toggleBinding })
}

/**
 * Connects component to app contexts
 */
const ConnectedInputManager: React.FC = () => {
  const dispatch: Dispatch<ActionTypes> | null = useContext(DispatchContext)
  const state: State | null = useContext(StateContext)
  if (!dispatch || !state) {
    return null
  }
  return MappedInputManager({ dispatch, state })
}

export default ConnectedInputManager
