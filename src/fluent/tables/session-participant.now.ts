import '@servicenow/sdk/global'
import { Table, ReferenceColumn, BooleanColumn, DateTimeColumn } from '@servicenow/sdk/core'

// Participants table - tracks who joins each session
export const x_250424_sn_scrum8_session_participant = Table({
  name: 'x_250424_sn_scrum8_session_participant',
  label: 'Session Participant',
  schema: {
    session: ReferenceColumn({
      label: 'Poker Session',
      referenceTable: 'x_250424_sn_scrum8_poker_session',
      mandatory: true
    }),
    user: ReferenceColumn({
      label: 'User',
      referenceTable: 'sys_user',
      mandatory: true
    }),
    is_online: BooleanColumn({
      label: 'Is Online',
      default: true
    }),
    joined_at: DateTimeColumn({
      label: 'Joined At'
    }),
    last_activity: DateTimeColumn({
      label: 'Last Activity'
    })
  },
  accessible_from: 'public',
  caller_access: 'tracking',
  actions: ['create', 'read', 'update', 'delete'],
  allow_web_service_access: true,
  display: 'user'
})