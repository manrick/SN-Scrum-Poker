import '@servicenow/sdk/global'
import { Acl } from '@servicenow/sdk/core'
import { scrumMasterRole, scrumUserRole } from '../roles/scrum-poker-roles.now.js'

// ACLs for Session Participant table - allow scrum users to read and create, scrum masters to manage

// Session Participant - Read access for scrum users and masters
export const sessionParticipantReadAcl = Acl({
    $id: Now.ID['session_participant_read_acl'],
    active: true,
    admin_overrides: true,
    type: 'record',
    table: 'x_250424_sn_scrum8_session_participant',
    operation: 'read',
    roles: [scrumMasterRole, scrumUserRole],
    description: 'Allow scrum users and masters to read session participants for AMB real-time updates'
})

// Session Participant - Create access for scrum users and masters (joining sessions)
export const sessionParticipantCreateAcl = Acl({
    $id: Now.ID['session_participant_create_acl'],
    active: true,
    admin_overrides: true,
    type: 'record',
    table: 'x_250424_sn_scrum8_session_participant',
    operation: 'create',
    roles: [scrumMasterRole, scrumUserRole],
    description: 'Allow scrum users and masters to create session participant records (join sessions)'
})

// Session Participant - Write access for scrum masters only
export const sessionParticipantWriteAcl = Acl({
    $id: Now.ID['session_participant_write_acl'],
    active: true,
    admin_overrides: true,
    type: 'record',
    table: 'x_250424_sn_scrum8_session_participant',
    operation: 'write',
    roles: [scrumMasterRole],
    description: 'Allow only scrum masters to update session participant records'
})

// Session Participant - Delete access for scrum masters only
export const sessionParticipantDeleteAcl = Acl({
    $id: Now.ID['session_participant_delete_acl'],
    active: true,
    admin_overrides: true,
    type: 'record',
    table: 'x_250424_sn_scrum8_session_participant',
    operation: 'delete',
    roles: [scrumMasterRole],
    description: 'Allow only scrum masters to delete session participant records'
})