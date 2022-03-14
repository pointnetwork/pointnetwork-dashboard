import { InstallationStepsEnum } from '../../@types/installation'

export type InstallationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'FINISHED'

export type InstallationLogData = {
  status: InstallationStatus
  msg: string
}

const initLogData: InstallationLogData = { status: 'NOT_STARTED', msg: '' }

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
  payload: string
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
          status: 'IN_PROGRESS',
          msg: action.payload,
        },
      }
    case InstallationStepsEnum.CODE:
      return {
        ...state,
        [InstallationStepsEnum.DIRECTORIES]: {
          ...state[InstallationStepsEnum.DIRECTORIES],
          status: 'FINISHED',
        },
        [InstallationStepsEnum.CODE]: {
          status: 'IN_PROGRESS',
          msg: action.payload,
        },
      }
    case InstallationStepsEnum.BROWSER:
      return {
        ...state,
        [InstallationStepsEnum.CODE]: {
          ...state[InstallationStepsEnum.CODE],
          status: 'FINISHED',
        },
        [InstallationStepsEnum.BROWSER]: {
          status: 'IN_PROGRESS',
          msg: action.payload,
        },
      }
    case InstallationStepsEnum.POINT_NODE:
      return {
        ...state,
        [InstallationStepsEnum.BROWSER]: {
          ...state[InstallationStepsEnum.BROWSER],
          status: 'FINISHED',
        },
        [InstallationStepsEnum.POINT_NODE]: {
          status: 'IN_PROGRESS',
          msg: action.payload,
        },
      }
    default:
      return state
  }
}
