import '@servicenow/sdk/global'
import { Table, StringColumn, ReferenceColumn, BooleanColumn, IntegerColumn, DateTimeColumn } from '@servicenow/sdk/core'

// Main poker sessions table
export const x_250424_sn_scrum8_poker_session = Table({
  name: 'x_250424_sn_scrum8_poker_session',
  label: 'Scrum Poker Session',
  schema: {
    session_name: StringColumn({
      label: 'Session Name',
      maxLength: 100,
      mandatory: true
    }),
    session_code: StringColumn({
      label: 'Session Code',
      maxLength: 10,
      mandatory: true
    }),
    scrum_master: ReferenceColumn({
      label: 'Scrum Master',
      referenceTable: 'sys_user',
      mandatory: true
    }),
    current_story: ReferenceColumn({
      label: 'Current Story',
      referenceTable: 'rm_story'
    }),
    state: StringColumn({
      label: 'Session State',
      choices: {
        waiting: { label: 'Waiting for participants', sequence: 0 },
        story_selected: { label: 'Story Selected', sequence: 1 },
        active: { label: 'Active story voting', sequence: 2 },
        revealing: { label: 'Revealing votes', sequence: 3 },
        completed: { label: 'Completed', sequence: 4 },
        paused: { label: 'Paused', sequence: 5 }
      },
      default: 'waiting'
    }),
    voting_started_at: DateTimeColumn({
      label: 'Voting Started At'
    }),
    voting_duration: IntegerColumn({
      label: 'Voting Duration (seconds)',
      default: '20'
    }),
    is_active: BooleanColumn({
      label: 'Is Active',
      default: true
    }),
    created_on: DateTimeColumn({
      label: 'Created On'
    })
  },
  accessible_from: 'public',
  caller_access: 'tracking',
  actions: ['create', 'read', 'update', 'delete'],
  allow_web_service_access: true,
  display: 'session_name'
})