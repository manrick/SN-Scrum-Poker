(function getParticipants(request, response) {
    try {
        var sessionId = request.pathParams.session_id
        var participants = []
        
        var participantGr = new GlideRecord('x_250424_sn_scrum8_session_participant')
        participantGr.addQuery('session', sessionId)
        participantGr.addQuery('is_online', true)
        participantGr.query()
        
        while (participantGr.next()) {
            var userGr = new GlideRecord('sys_user')
            if (userGr.get(participantGr.getValue('user'))) {
                participants.push({
                    user_id: participantGr.getValue('user'),
                    name: userGr.getDisplayValue(),
                    joined_at: participantGr.getValue('joined_at'),
                    avatarPath: GlideAvatarFinder.getAvatarPath(userGr.getUniqueValue()) + ""
                })
            }
        }
        
        response.setStatus(200)
        response.setBody({ participants: participants })
    } catch (e) {
        gs.error('Exception in getParticipants: ' + e.message)
        response.setStatus(500)
        response.setBody({ error: 'Server error: ' + e.message })
    }
})(request, response)