import '@servicenow/sdk/global'
import { Table, StringColumn, ReferenceColumn, DateTimeColumn } from '@servicenow/sdk/core'

// Votes table - tracks individual votes for each story
export const x_250424_sn_scrum8_poker_vote = Table({
  name: 'x_250424_sn_scrum8_poker_vote',
  label: 'Poker Vote',
  schema: {
    session: ReferenceColumn({
      label: 'Poker Session',
      referenceTable: 'x_250424_sn_scrum8_poker_session',
      mandatory: true
    }),
    story: ReferenceColumn({
      label: 'Story',
      referenceTable: 'rm_story',
      mandatory: true
    }),
    voter: ReferenceColumn({
      label: 'Voter',
      referenceTable: 'sys_user',
      mandatory: true
    }),
    vote_value: StringColumn({
      label: 'Vote Value',
      choices: {
        '1': { label: '1', sequence: 0 },
        '2': { label: '2', sequence: 1 },
        '3': { label: '3', sequence: 2 },
        '5': { label: '5', sequence: 3 },
        '8': { label: '8', sequence: 4 },
        '13': { label: '13', sequence: 5 },
        '20': { label: '20', sequence: 6 },
        'unknown': { label: '?', sequence: 7 }
      },
      mandatory: true
    }),
    voted_at: DateTimeColumn({
      label: 'Voted At'
    })
  },
  accessible_from: 'public',
  caller_access: 'tracking',
  actions: ['create', 'read', 'update', 'delete'],
  allow_web_service_access: true,
  display: 'vote_value'
})