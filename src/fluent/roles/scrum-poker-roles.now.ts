import '@servicenow/sdk/global'
import { Role } from '@servicenow/sdk/core'

// Scrum Master role - can create and manage poker sessions
export const scrumMasterRole = Role({
  name: 'x_250424_sn_scrum8.scrum_poker_scrum_master',
  description: 'Scrum Master role for SN Scrum Poker - can create and manage poker sessions',
  grantable: true,
  can_delegate: false,
  elevated_privilege: false
})

// Scrum User role - can participate in poker sessions
export const scrumUserRole = Role({
  name: 'x_250424_sn_scrum8.scrum_poker_scrum_user', 
  description: 'Scrum User role for SN Scrum Poker - can participate in poker sessions',
  grantable: true,
  can_delegate: false,
  elevated_privilege: false
})