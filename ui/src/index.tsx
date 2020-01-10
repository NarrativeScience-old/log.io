import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/app'
import { initializeState } from './reducers'
import { createSocket } from './socket'

import './index.scss'

const Root: React.FC = () => {
  const socket = createSocket()
  const initialState = initializeState(socket)
  return (
    <App
      socket={socket}
      initialState={initialState}
    />
  )
}

ReactDOM.render(<Root />, document.getElementById('root'))
