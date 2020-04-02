import { Dispatch } from 'react'
import { UrlBindingStateType } from '../../middleware/url'
import { BindingActions } from '../../reducers/bindings/types'
import { InputActions } from '../../reducers/inputs/types'
import { ScreenActions } from '../../reducers/screens/types'
import { ActionTypes } from '../../reducers/types'

/**
 * Initializes screen state & any saved input bindings.
 * Parses saved state from URL location hash
 */
const initializeState = (
  dispatch: Dispatch<ActionTypes>,
  locationHash: string
) => {
  if (locationHash === '' || locationHash === '#') {
    dispatch({ type: ScreenActions.ADD_SCREEN })
    return
  }
  // Parse screen state from URL hash
  let screens: UrlBindingStateType = {}
  try {
    screens = JSON.parse(decodeURI(locationHash.slice(1)))
  } catch (e) {
    console.warn("Unable to parse previous screen state:", locationHash)
    dispatch({ type: ScreenActions.ADD_SCREEN })
    return
  }
  // Trigger redux actions to initialize screens, inputs, and bindings
  Object.keys(screens).forEach((screenId) => {
    dispatch({
      type: ScreenActions.ADD_SCREEN,
      screenId,
    })
    screens[screenId].forEach((inputName) => {
      const [stream, source] = inputName.split('|')
      dispatch({
        type: InputActions.ENSURE_INPUT,
        inputName,
        stream,
        source,
      })
      dispatch({
        type: BindingActions.BIND_INPUT_TO_SCREEN,
        inputName,
        stream,
        source,
        screenId,
      })
    })
  })
}

export default initializeState