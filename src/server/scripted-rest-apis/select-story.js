(function selectStory(request, response) {
    try {
        var sessionId = request.pathParams.session_id
        var requestBody = request.body.data
        var storyId = requestBody.story_id
        var currentUser = gs.getUserID()
        
        if (!storyId) {
            response.setStatus(400)
            response.setBody({ success: false, error: 'Story ID is required' })
            return
        }
        
        var sessionGr = new GlideRecord('x_250424_sn_scrum8_poker_session')
        if (sessionGr.get(sessionId) && sessionGr.getValue('scrum_master') === currentUser) {
            sessionGr.setValue('current_story', storyId)
            sessionGr.setValue('state', 'story_selected')
            // Clear voting timestamp when selecting a new story
            sessionGr.setValue('voting_started_at', '')
            sessionGr.update()
            
            // Clear any existing votes for previous stories in this session
            var voteGr = new GlideRecord('x_250424_sn_scrum8_poker_vote')
            voteGr.addQuery('session', sessionId)
            voteGr.deleteMultiple()
            
            // Get story details to return
            var storyGr = new GlideRecord('rm_story')
            if (storyGr.get(storyId)) {
                var storyDetails = {
                    sys_id: storyGr.sys_id.toString(),
                    number: storyGr.number.toString(),
                    short_description: storyGr.short_description.toString(),
                    description: storyGr.description ? storyGr.description.toString() : ''
                }
                
                response.setStatus(200)
                response.setBody({ 
                    success: true, 
                    story: storyDetails 
                })
            } else {
                response.setStatus(404)
                response.setBody({ success: false, error: 'Story not found' })
            }
        } else {
            response.setStatus(403)
            response.setBody({ success: false, error: 'Not authorized or session not found' })
        }
    } catch (e) {
        gs.error('Exception in selectStory: ' + e.message)
        response.setStatus(500)
        response.setBody({ success: false, error: 'Server error: ' + e.message })
    }
})(request, response)