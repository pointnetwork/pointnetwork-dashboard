import { InstallationStepsEnum } from '../../@types/installation'

export type InstallationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'FINISHED'

export type InstallationLogData = {
  status: InstallationStatus
  message: string
  progress: number | null
}

const initLogData: InstallationLogData = {
  status: 'NOT_STARTED',
  message: '',
  progress: 0,
}

type InstallationLogState = {
  // eslint-disable-next-line no-unused-vars
  [k in InstallationStepsEnum]: InstallationLogData
}

export const initialState: InstallationLogState = {
  [InstallationStepsEnum.DIRECTORIES]: initLogData,
  [InstallationStepsEnum.CODE]: initLogData,
  [InstallationStepsEnum.BROWSER]: initLogData,
  [InstallationStepsEnum.POINT_NODE]: initLogData,
}

type Action = {
  type: InstallationStepsEnum
  payload: {
    message: string
    progress: number | null
  }
}

export function installationLogReducer(
  state: InstallationLogState,
  action: Action
): InstallationLogState {
  switch (action.type) {
    case InstallationStepsEnum.DIRECTORIES:
      return {
        ...state,
        [InstallationStepsEnum.DIRECTORIES]: {
          status: action.payload.progress === 100 ? 'FINISHED' : 'IN_PROGRESS',
          message: action.payload.message,
          progress:
            action.payload.progress ??
            state[InstallationStepsEnum.DIRECTORIES].progress,
        },
      }
    case InstallationStepsEnum.CODE:
      return {
        ...state,
        [InstallationStepsEnum.DIRECTORIES]: {
          ...state[InstallationStepsEnum.DIRECTORIES],
          status: 'FINISHED',
          progress: 100,
        },
        [InstallationStepsEnum.CODE]: {
          status: action.payload.progress === 100 ? 'FINISHED' : 'IN_PROGRESS',
          message: action.payload.message,
          progress:
            action.payload.progress ??
            state[InstallationStepsEnum.CODE].progress,
        },
      }
    case InstallationStepsEnum.BROWSER:
      return {
        ...state,
        [InstallationStepsEnum.CODE]: {
          ...state[InstallationStepsEnum.CODE],
          status: 'FINISHED',
          progress: 100,
        },
        [InstallationStepsEnum.BROWSER]: {
          status: action.payload.progress === 100 ? 'FINISHED' : 'IN_PROGRESS',
          message: action.payload.message,
          progress:
            action.payload.progress ??
            state[InstallationStepsEnum.BROWSER].progress,
        },
      }
    case InstallationStepsEnum.POINT_NODE:
      return {
        ...state,
        [InstallationStepsEnum.BROWSER]: {
          ...state[InstallationStepsEnum.BROWSER],
          status: 'FINISHED',
          progress: 100,
        },
        [InstallationStepsEnum.POINT_NODE]: {
          status: action.payload.progress === 100 ? 'FINISHED' : 'IN_PROGRESS',
          message: action.payload.message,
          progress:
            action.payload.progress ??
            state[InstallationStepsEnum.POINT_NODE].progress,
        },
      }
    default:
      return state
  }
}
