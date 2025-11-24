import '@servicenow/sdk/global'
import { Acl } from '@servicenow/sdk/core'
import { scrumMasterRole, scrumUserRole } from '../roles/scrum-poker-roles.now.js'

// ACLs for Poker Session table - allow scrum users to read and scrum masters to manage

// Poker Session - Read access for scrum users and masters
export const pokerSessionReadAcl = Acl({
    $id: Now.ID['poker_session_read_acl'],
    active: true,
    admin_overrides: true,
    type: 'record',
    table: 'x_250424_sn_scrum8_poker_session',
    operation: 'read',
    roles: [scrumMasterRole, scrumUserRole],
    description: 'Allow scrum users and masters to read poker sessions for AMB real-time updates'
})

// Poker Session - Write access for scrum masters only
export const pokerSessionWriteAcl = Acl({
    $id: Now.ID['poker_session_write_acl'],
    active: true,
    admin_overrides: true,
    type: 'record',
    table: 'x_250424_sn_scrum8_poker_session',
    operation: 'write',
    roles: [scrumMasterRole],
    description: 'Allow only scrum masters to update poker sessions'
})

// Poker Session - Create access for scrum masters only
export const pokerSessionCreateAcl = Acl({
    $id: Now.ID['poker_session_create_acl'],
    active: true,
    admin_overrides: true,
    type: 'record',
    table: 'x_250424_sn_scrum8_poker_session',
    operation: 'create',
    roles: [scrumMasterRole],
    description: 'Allow only scrum masters to create poker sessions'
})

// Poker Session - Delete access for scrum masters only
export const pokerSessionDeleteAcl = Acl({
    $id: Now.ID['poker_session_delete_acl'],
    active: true,
    admin_overrides: true,
    type: 'record',
    table: 'x_250424_sn_scrum8_poker_session',
    operation: 'delete',
    roles: [scrumMasterRole],
    description: 'Allow only scrum masters to delete poker sessions'
})