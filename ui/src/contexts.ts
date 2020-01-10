import { createContext, Dispatch } from 'react'
import { State, ActionTypes } from './reducers/types'

export const DispatchContext = createContext<Dispatch<ActionTypes> | null>(null)
export const StateContext = createContext<State | null>(null)
