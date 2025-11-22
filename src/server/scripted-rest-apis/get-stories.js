(function getStories(request, response) {
    try {
        var stories = []
        var storyGr = new GlideRecord('rm_story')
        storyGr.addQuery('state', '!=', '3')  // Exclude completed stories (state = 3)
        storyGr.addQuery('active', 'true')    // Only active stories
        storyGr.orderBy('number')
        storyGr.setLimit(100) // Limit to prevent large result sets
        storyGr.query()
        
        while (storyGr.next()) {
            stories.push({
                sys_id: storyGr.getUniqueValue(),
                number: storyGr.getValue('number'),
                short_description: storyGr.getValue('short_description'),
                description: storyGr.getValue('description'),
                story_points: storyGr.getValue('story_points')
            })
        }
        
        response.setStatus(200)
        response.setBody({ stories: stories })
    } catch (e) {
        gs.error('Exception in getStories: ' + e.message)
        response.setStatus(500)
        response.setBody({ error: 'Server error: ' + e.message })
    }
})(request, response)