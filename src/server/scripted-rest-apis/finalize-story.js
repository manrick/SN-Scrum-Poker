(function finalizeStoryPoints(request, response) {
    try {
        var sessionId = request.pathParams.session_id
        var requestBody = request.body.data
        var finalPoints = requestBody.final_points
        var currentUser = gs.getUserID()
        
        if (!finalPoints) {
            response.setStatus(400)
            response.setBody({ success: false, error: 'Final points are required' })
            return
        }
        
        var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
        if (sessionGr.get(sessionId) && sessionGr.getValue('scrum_master') === currentUser) {
            var storyId = sessionGr.getValue('current_story')
            
            // Update the story with the final points
            var storyGr = new GlideRecord('rm_story')
            if (storyGr.get(storyId)) {
                storyGr.setValue('story_points', finalPoints)
                storyGr.update()
                
                // Reset session state for next story
                sessionGr.setValue('state', 'waiting')
                sessionGr.setValue('current_story', '')
                sessionGr.update()
                
                response.setStatus(200)
                response.setBody({ success: true })
            } else {
                response.setStatus(404)
                response.setBody({ success: false, error: 'Story not found' })
            }
        } else {
            response.setStatus(403)
            response.setBody({ success: false, error: 'Not authorized or session not found' })
        }
    } catch (e) {
        gs.error('Exception in finalizeStoryPoints: ' + e.message)
        response.setStatus(500)
        response.setBody({ success: false, error: 'Server error: ' + e.message })
    }
})(request, response)