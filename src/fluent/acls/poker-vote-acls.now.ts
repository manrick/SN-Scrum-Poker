import '@servicenow/sdk/global'
import { Acl } from '@servicenow/sdk/core'
import { scrumMasterRole, scrumUserRole } from '../roles/scrum-poker-roles.now.js'

// ACLs for Poker Vote table - allow scrum users to read and create votes, scrum masters to manage

// Poker Vote - Read access for scrum users and masters
export const pokerVoteReadAcl = Acl({
    $id: Now.ID['poker_vote_read_acl'],
    active: true,
    admin_overrides: true,
    type: 'record',
    table: 'x_250424_sn_scrum8_poker_vote',
    operation: 'read',
    roles: [scrumMasterRole, scrumUserRole],
    description: 'Allow scrum users and masters to read poker votes for AMB real-time updates'
})

// Poker Vote - Create access for scrum users and masters (submitting votes)
export const pokerVoteCreateAcl = Acl({
    $id: Now.ID['poker_vote_create_acl'],
    active: true,
    admin_overrides: true,
    type: 'record',
    table: 'x_250424_sn_scrum8_poker_vote',
    operation: 'create',
    roles: [scrumMasterRole, scrumUserRole],
    description: 'Allow scrum users and masters to create poker vote records (submit votes)'
})

// Poker Vote - Write access for scrum masters only
export const pokerVoteWriteAcl = Acl({
    $id: Now.ID['poker_vote_write_acl'],
    active: true,
    admin_overrides: true,
    type: 'record',
    table: 'x_250424_sn_scrum8_poker_vote',
    operation: 'write',
    roles: [scrumMasterRole],
    description: 'Allow only scrum masters to update poker vote records'
})

// Poker Vote - Delete access for scrum masters only (clearing votes)
export const pokerVoteDeleteAcl = Acl({
    $id: Now.ID['poker_vote_delete_acl'],
    active: true,
    admin_overrides: true,
    type: 'record',
    table: 'x_250424_sn_scrum8_poker_vote',
    operation: 'delete',
    roles: [scrumMasterRole],
    description: 'Allow only scrum masters to delete poker vote records (clear votes)'
})