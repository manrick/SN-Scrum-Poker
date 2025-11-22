import '@servicenow/sdk/global'
import { RestApi } from '@servicenow/sdk/core'

export const ScrumPokerRestApi = RestApi({
    $id: Now.ID['scrum_poker_rest_api'],
    name: 'Scrum Poker API',
    service_id: 'scrum_poker',
    short_description: 'REST API for Scrum Poker real-time operations',
    active: true,
    enforce_acl: [], // No ACL enforcement for easier access
    routes: [
        {
            $id: Now.ID['create_session_route'],
            name: 'Create Session',
            method: 'POST',
            path: '/session',
            script: Now.include('../../server/scripted-rest-apis/create-session.js'),
            short_description: 'Create a new poker session',
            authorization: false, // No additional auth required
            authentication: false, // No additional authentication required
        },
        {
            $id: Now.ID['join_session_route'],
            name: 'Join Session',
            method: 'POST', 
            path: '/session/join',
            script: Now.include('../../server/scripted-rest-apis/join-session.js'),
            short_description: 'Join an existing session',
            authorization: false,
            authentication: false,
        },
        {
            $id: Now.ID['get_participants_route'],
            name: 'Get Participants',
            method: 'GET',
            path: '/session/{session_id}/participants',
            script: Now.include('../../server/scripted-rest-apis/get-participants.js'),
            short_description: 'Get session participants',
            authorization: false,
            authentication: false,
        },
        {
            $id: Now.ID['get_stories_route'],
            name: 'Get Stories',
            method: 'GET',
            path: '/stories',
            script: Now.include('../../server/scripted-rest-apis/get-stories.js'),
            short_description: 'Get list of stories',
            authorization: false,
            authentication: false,
        },
        {
            $id: Now.ID['start_voting_route'],
            name: 'Start Voting',
            method: 'POST',
            path: '/session/{session_id}/voting/start',
            script: Now.include('../../server/scripted-rest-apis/start-voting.js'),
            short_description: 'Start voting for a story',
            authorization: false,
            authentication: false,
        },
        {
            $id: Now.ID['submit_vote_route'],
            name: 'Submit Vote',
            method: 'POST',
            path: '/session/{session_id}/vote',
            script: Now.include('../../server/scripted-rest-apis/submit-vote.js'),
            short_description: 'Submit a vote',
            authorization: false,
            authentication: false,
        },
        {
            $id: Now.ID['reveal_votes_route'],
            name: 'Reveal Votes',
            method: 'POST',
            path: '/session/{session_id}/voting/reveal',
            script: Now.include('../../server/scripted-rest-apis/reveal-votes.js'),
            short_description: 'Reveal all votes',
            authorization: false,
            authentication: false,
        },
        {
            $id: Now.ID['finalize_story_route'],
            name: 'Finalize Story Points',
            method: 'POST',
            path: '/session/{session_id}/finalize',
            script: Now.include('../../server/scripted-rest-apis/finalize-story.js'),
            short_description: 'Finalize story points',
            authorization: false,
            authentication: false,
        },
        {
            $id: Now.ID['get_session_status_route'],
            name: 'Get Session Status',
            method: 'GET',
            path: '/session/{session_id}/status',
            script: Now.include('../../server/scripted-rest-apis/get-session-status.js'),
            short_description: 'Get session status',
            authorization: false,
            authentication: false,
        }
    ]
})