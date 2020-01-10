export interface RegistrationEvent {
  inputName: string
  stream: string
  source: string
}

export interface PingEvent {
  inputName: string
  stream: string
  source: string
}

export interface MessageEvent {
  inputName: string
  stream: string
  source: string
  msg: string
}
