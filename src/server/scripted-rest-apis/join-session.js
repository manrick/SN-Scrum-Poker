(function joinSession(request, response) {
    try {
        var requestBody = request.body.data
        var sessionCode = requestBody.session_code
        var currentUser = gs.getUserID()
        
        if (!sessionCode) {
            response.setStatus(400)
            response.setBody({ success: false, error: 'Session code is required' })
            return
        }
        
        gs.info('User ' + currentUser + ' attempting to join session: ' + sessionCode)
        
        var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
        sessionGr.addQuery('session_code', sessionCode)
        sessionGr.addQuery('is_active', true)
        sessionGr.query()
        
        if (sessionGr.next()) {
            // Check if user already joined
            var existingGr = new GlideRecord('x_250424_sn_scrum8_session_participant')
            existingGr.addQuery('session', sessionGr.getUniqueValue())
            existingGr.addQuery('user', currentUser)
            existingGr.query()
            
            var now = new GlideDateTime()
            
            if (!existingGr.next()) {
                // Add new participant
                var participantGr = new GlideRecord('x_250424_sn_scrum8_session_participant')
                participantGr.initialize()
                participantGr.setValue('session', sessionGr.getUniqueValue())
                participantGr.setValue('user', currentUser)
                participantGr.setValue('is_online', true)
                participantGr.setValue('joined_at', now.getDisplayValue())
                participantGr.setValue('last_activity', now.getDisplayValue())
                participantGr.insert()
            } else {
                // Update existing participant to online
                existingGr.setValue('is_online', true)
                existingGr.setValue('last_activity', now.getDisplayValue())
                existingGr.update()
            }
            
            response.setStatus(200)
            response.setBody({
                success: true,
                session_id: sessionGr.getUniqueValue(),
                session_name: sessionGr.getValue('session_name'),
                is_scrum_master: sessionGr.getValue('scrum_master') === currentUser
            })
        } else {
            response.setStatus(404)
            response.setBody({ success: false, error: 'Session not found' })
        }
    } catch (e) {
        gs.error('Exception in joinSession: ' + e.message)
        response.setStatus(500)
        response.setBody({ success: false, error: 'Server error: ' + e.message })
    }
})(request, response)