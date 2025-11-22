(function createSession(request, response) {
    try {
        var requestBody = request.body.data
        var sessionName = requestBody.session_name
        var currentUser = gs.getUserID()
        
        if (!sessionName) {
            response.setStatus(400)
            response.setBody({ success: false, error: 'Session name is required' })
            return
        }
        
        // Generate session code
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        var sessionCode = ''
        for (var i = 0; i < 6; i++) {
            sessionCode += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        
        gs.info('Creating session: ' + sessionName + ' for user: ' + currentUser)
        
        var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
        sessionGr.initialize()
        sessionGr.setValue('session_name', sessionName)
        sessionGr.setValue('session_code', sessionCode)
        sessionGr.setValue('scrum_master', currentUser)
        sessionGr.setValue('state', 'waiting')
        sessionGr.setValue('is_active', true)
        
        // Set created_on explicitly using GlideDateTime
        var now = new GlideDateTime()
        sessionGr.setValue('created_on', now.getDisplayValue())
        
        var sessionId = sessionGr.insert()
        
        if (sessionId) {
            // Add the scrum master as first participant
            var participantGr = new GlideRecord('x_250424_sn_scrum8_session_participant')
            participantGr.initialize()
            participantGr.setValue('session', sessionId)
            participantGr.setValue('user', currentUser)
            participantGr.setValue('is_online', true)
            
            // Set joined_at explicitly using GlideDateTime
            var joinTime = new GlideDateTime()
            participantGr.setValue('joined_at', joinTime.getDisplayValue())
            participantGr.setValue('last_activity', joinTime.getDisplayValue())
            
            participantGr.insert()
            
            gs.info('Session created successfully: ' + sessionId)
            
            response.setStatus(200)
            response.setBody({
                success: true,
                session_id: sessionId,
                session_code: sessionCode
            })
        } else {
            gs.error('Failed to insert session record')
            response.setStatus(500)
            response.setBody({ success: false, error: 'Failed to create session' })
        }
    } catch (e) {
        gs.error('Exception in createSession: ' + e.message)
        response.setStatus(500)
        response.setBody({ success: false, error: 'Server error: ' + e.message })
    }
})(request, response)