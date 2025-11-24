/**
 * Enhanced Scrum Poker Service using ServiceNow AMB (Asynchronous Message Bus)
 * for real-time updates via record watchers instead of polling
 */
export class ScrumPokerWebSocketService {
    constructor() {
        this.baseUrl = '/api/x_250424_sn_scrum8/scrum_poker'
        this.ambClient = null
        this.channels = new Map()
        this.subscriptions = new Map()
        this.isConnected = false
        this.initializationPromise = null
        
        // Initialize AMB client after page is fully loaded and AMB is connected
        this.ensureAMBInitialization()
    }

    /**
     * Ensure AMB initialization happens after page is fully loaded and AMB is properly connected
     */
    ensureAMBInitialization() {
        if (this.initializationPromise) {
            return this.initializationPromise
        }

        this.initializationPromise = new Promise((resolve) => {
            // Check if page is already loaded
            if (document.readyState === 'complete') {
                // Page is already loaded, wait for AMB connection
                this.waitForAMBConnection().then(resolve)
            } else {
                // Wait for page to fully load first
                const onLoad = () => {
                    window.removeEventListener('load', onLoad)
                    // Then wait for AMB connection
                    this.waitForAMBConnection().then(resolve)
                }
                window.addEventListener('load', onLoad)
            }
        })

        return this.initializationPromise
    }

    /**
     * Wait for AMB to be available and properly connected
     */
    async waitForAMBConnection() {
        console.log('Waiting for AMB connection to be established...')
        
        // First, wait for window.amb to be available (this works for scrum users)
        await this.waitForAMBAvailable()
        
        // Then wait for the connection to be opened
        await this.waitForConnectionOpened()
        
        // Finally initialize the client
        await this.initializeAMBClient()
    }

    /**
     * Wait for window.amb to be available (correct reference that works for scrum users)
     */
    waitForAMBAvailable() {
        return new Promise((resolve) => {
            const checkAMB = () => {
                if (typeof window !== 'undefined' && window.amb && typeof window.amb.getClient === 'function') {
                    console.log('✅ window.amb.getClient is available')
                    resolve()
                } else {
                    console.log('⏳ Waiting for window.amb.getClient...')
                    setTimeout(checkAMB, 100)
                }
            }
            checkAMB()
        })
    }

    /**
     * Wait for AMB connection to be in 'opened' state
     */
    waitForConnectionOpened() {
        return new Promise((resolve) => {
            const checkConnection = () => {
                try {
                    const state = window.amb.getClient().getServerConnection().getState()
                    console.log('AMB Connection State:', state)
                    
                    if (state === 'opened') {
                        console.log('✅ AMB connection is opened')
                        resolve()
                    } else {
                        console.log('⏳ Waiting for AMB connection to open... Current state:', state)
                        setTimeout(checkConnection, 200)
                    }
                } catch (error) {
                    console.log('⏳ Error checking connection state, retrying...', error.message)
                    setTimeout(checkConnection, 200)
                }
            }
            checkConnection()
        })
    }

    /**
     * Initialize ServiceNow AMB Client after connection is confirmed to be opened
     */
    async initializeAMBClient() {
        try {
            console.log('Initializing AMB Client with confirmed connection...')
            
            // Get the client using the correct reference that works for scrum users
            this.ambClient = window.amb.getClient()
            
            if (this.ambClient) {
                console.log('AMB Client obtained from window.amb.getClient()')
                console.log('Available AMB methods:', Object.getOwnPropertyNames(this.ambClient).filter(name => typeof this.ambClient[name] === 'function'))
                
                // Verify connection state one more time
                const finalState = this.ambClient.getServerConnection().getState()
                this.isConnected = finalState === 'opened'
                
                console.log('Final AMB Connection State:', finalState)
                console.log('AMB Client connected:', this.isConnected)
                
                if (this.isConnected) {
                    console.log('✅ AMB Client successfully initialized - Real-time updates available')
                } else {
                    console.warn('⚠️ AMB Client connection state changed unexpectedly')
                    console.log('Expected state: "opened", Actual state:', finalState)
                }
            } else {
                console.warn('Failed to get AMB client instance from window.amb.getClient()')
            }
        } catch (error) {
            console.error('Failed to initialize AMB Client:', error)
            this.isConnected = false
        }
    }

    /**
     * Set up record watcher for a specific record (sys_id only) or entire table
     * Only sys_id based filters work with AMB!
     */
    async setupRecordWatcher(tableName, sysId, callback) {
        // Ensure AMB is initialized first
        await this.ensureAMBInitialization()

        if (!this.ambClient || !this.isConnected) {
            console.warn(`AMB Client not available for watching table: ${tableName}`)
            return null
        }

        try {
            let channelId
            
            if (sysId) {
                // Watch specific record using sys_id (this works)
                console.log(`Setting up record watcher for specific record in ${tableName}`)
                console.log(`Record sys_id: ${sysId}`)
                
                const encodedQuery = `sys_id=${sysId}`
                const base64EncodedQuery = btoa(unescape(encodeURIComponent(encodedQuery)))
                channelId = `/rw/default/${tableName}/${base64EncodedQuery}`
                
                console.log(`Encoded query: ${encodedQuery}`)
                console.log(`Base64 encoded query: ${base64EncodedQuery}`)
            } else {
                // Watch entire table (no filter)
                console.log(`Setting up table-level watcher for ${tableName}`)
                channelId = `/rw/${tableName}`
            }
            
            console.log(`Channel ID: ${channelId}`)
            
            const channel = this.ambClient.getChannel(channelId)
            
            if (!channel) {
                console.error(`Failed to get channel for ${channelId}`)
                return null
            }
            
            console.log(`Channel created for: ${channelId}`)
            
            // Add a listener for incoming messages
            const subscription = channel.subscribe((response) => {
                console.log(`📡 Record change detected on ${tableName}:`, response)
                
                // Extract data from response
                const recordData = response.data
                console.log(`📝 Record data:`, recordData)
                
                callback({
                    tableName: tableName,
                    operation: recordData.operation || 'update',
                    record: recordData,
                    rawResponse: response
                })
            })
            
            // Store channel and subscription for cleanup
            const watcherId = `${tableName}_${sysId || 'table'}_${Date.now()}`
            this.channels.set(watcherId, channel)
            this.subscriptions.set(watcherId, subscription)
            
            console.log(`✅ Record watcher established for ${tableName} with ID: ${watcherId}`)
            return watcherId
            
        } catch (error) {
            console.error(`Error setting up record watcher for ${tableName}:`, error)
            return null
        }
    }

    /**
     * Watch session-related tables for changes
     * Uses sys_id for session, table-level for participants/votes with callback filtering
     */
    async watchSession(sessionId, callbacks) {
        console.log(`🎯 Setting up session watchers for session ID: ${sessionId}`)
        
        // Ensure AMB is initialized first
        await this.ensureAMBInitialization()
        
        const watchers = {}

        // 1. Watch specific session record using sys_id (this works!)
        watchers.session = await this.setupRecordWatcher(
            'x_250424_sn_scrum8_poker_session',
            sessionId, // Use session sys_id directly
            (change) => {
                console.log('🎮 Session record change detected:', change)
                console.log('🎮 Session record data:', change.record)
                
                if (callbacks.onSessionUpdate) {
                    // Make sure we pass the record data in the correct format
                    console.log('🎮 Calling onSessionUpdate with:', change.record, change.operation)
                    callbacks.onSessionUpdate(change.record, change.operation)
                } else {
                    console.warn('🎮 No onSessionUpdate callback provided!')
                }
            }
        )

        // 2. Watch ALL participants (table level) and filter in callback
        watchers.participants = await this.setupRecordWatcher(
            'x_250424_sn_scrum8_session_participant',
            null, // No sys_id = table level watcher
            (change) => {
                console.log('👥 Participant record change (all):', change)
                
                // Filter for this session in the callback
                const record = change.record
                if (record && record.session && record.session === sessionId) {
                    console.log('👥 Participant change for our session:', record)
                    if (callbacks.onParticipantsUpdate) {
                        callbacks.onParticipantsUpdate({
                            operation: change.operation,
                            participant: record
                        })
                    }
                } else {
                    console.log('👥 Participant change for different session, ignoring')
                }
            }
        )

        // 3. Watch ALL votes (table level) and filter in callback
        watchers.votes = await this.setupRecordWatcher(
            'x_250424_sn_scrum8_poker_vote',
            null, // No sys_id = table level watcher
            (change) => {
                console.log('🗳️ Vote record change (all):', change)
                
                // Filter for this session in the callback
                const record = change.record
                if (record && record.session && record.session === sessionId) {
                    console.log('🗳️ Vote change for our session:', record)
                    if (callbacks.onVotesUpdate) {
                        callbacks.onVotesUpdate({
                            operation: change.operation,
                            vote: record
                        })
                    }
                } else {
                    console.log('🗳️ Vote change for different session, ignoring')
                }
            }
        )

        console.log('✅ Session watchers setup complete:', watchers)
        return watchers
    }

    /**
     * Stop watching session-related tables
     */
    unwatchSession(watchers) {
        if (watchers && typeof watchers === 'object') {
            Object.entries(watchers).forEach(([key, watcherId]) => {
                if (watcherId) {
                    this.stopRecordWatcher(watcherId)
                    console.log(`Stopped watching ${key} with ID: ${watcherId}`)
                }
            })
        }
    }

    /**
     * Stop a specific record watcher
     */
    stopRecordWatcher(watcherId) {
        if (this.subscriptions.has(watcherId)) {
            const subscription = this.subscriptions.get(watcherId)
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe()
                console.log(`Unsubscribed from ${watcherId}`)
            }
            this.subscriptions.delete(watcherId)
        }
        
        if (this.channels.has(watcherId)) {
            const channel = this.channels.get(watcherId)
            // Channel cleanup if needed
            this.channels.delete(watcherId)
        }
        
        console.log(`Record watcher ${watcherId} stopped`)
    }

    /**
     * Get connection status for UI display using correct AMB client reference
     */
    async getConnectionStatus() {
        await this.ensureAMBInitialization()
        
        let connectionState = 'UNAVAILABLE'
        let connected = false
        
        try {
            if (window.amb && window.amb.getClient) {
                connectionState = window.amb.getClient().getServerConnection().getState()
                connected = connectionState === 'opened'
            }
        } catch (error) {
            console.error('Error getting connection state:', error)
        }
        
        return {
            connected: connected,
            clientAvailable: !!this.ambClient,
            ambAvailable: !!(typeof window !== 'undefined' && window.amb && window.amb.getClient),
            connectionState: connectionState
        }
    }

    /**
     * Synchronous version for immediate status checks
     */
    getConnectionStatusSync() {
        let connectionState = 'UNAVAILABLE'
        let connected = false
        
        try {
            if (window.amb && window.amb.getClient) {
                connectionState = window.amb.getClient().getServerConnection().getState()
                connected = connectionState === 'opened'
            }
        } catch (error) {
            console.error('Error getting connection state:', error)
        }
        
        return {
            connected: connected,
            clientAvailable: !!this.ambClient,
            ambAvailable: !!(typeof window !== 'undefined' && window.amb && window.amb.getClient),
            connectionState: connectionState
        }
    }

    /**
     * Enhanced REST API methods (keeping existing functionality)
     */
    async makeRestCall(endpoint, method = 'GET', data = null) {
        try {
            console.log(`Making ${method} request to:`, `${this.baseUrl}${endpoint}`)
            console.log('Request data:', data)
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-UserToken': window.g_ck || '',
                },
                credentials: 'same-origin'
            }
            
            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data)
            }
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, options)
            
            if (!response.ok) {
                let errorText
                try {
                    const errorData = await response.json()
                    errorText = errorData.error || errorData.message || `HTTP ${response.status}`
                } catch (e) {
                    errorText = await response.text()
                }
                console.error('HTTP Error:', response.status, errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }
            
            const responseData = await response.json()
            const actualData = responseData.result || responseData
            
            return actualData
        } catch (error) {
            console.error('REST API Error:', error)
            throw error
        }
    }

    // REST API methods
    async createSession(sessionName) {
        return this.makeRestCall('/session', 'POST', {
            session_name: sessionName
        })
    }

    async joinSession(sessionCode) {
        return this.makeRestCall('/session/join', 'POST', {
            session_code: sessionCode
        })
    }

    async selectStory(sessionId, storyId) {
        return this.makeRestCall(`/session/${sessionId}/story/select`, 'POST', {
            story_id: storyId
        })
    }

    async getParticipants(sessionId) {
        const response = await this.makeRestCall(`/session/${sessionId}/participants`)
        return response.participants || []
    }

    async startVoting(sessionId, storyId) {
        return this.makeRestCall(`/session/${sessionId}/voting/start`, 'POST', {
            story_id: storyId
        })
    }

    async submitVote(sessionId, storyId, voteValue) {
        return this.makeRestCall(`/session/${sessionId}/vote`, 'POST', {
            story_id: storyId,
            vote_value: voteValue
        })
    }

    async revealVotes(sessionId) {
        return this.makeRestCall(`/session/${sessionId}/voting/reveal`, 'POST')
    }

    async finalizeStoryPoints(sessionId, finalPoints) {
        return this.makeRestCall(`/session/${sessionId}/finalize`, 'POST', {
            final_points: finalPoints
        })
    }

    async getSessionStatus(sessionId) {
        return this.makeRestCall(`/session/${sessionId}/status`)
    }

    async getStories() {
        const response = await this.makeRestCall('/stories')
        return response.stories || []
    }

    /**
     * Cleanup method to disconnect AMB client and stop all watchers
     */
    disconnect() {
        console.log('Disconnecting AMB client and cleaning up watchers...')
        
        // Stop all record watchers
        const watcherIds = Array.from(this.subscriptions.keys())
        watcherIds.forEach(watcherId => {
            this.stopRecordWatcher(watcherId)
        })

        // Clear collections
        this.subscriptions.clear()
        this.channels.clear()

        // Disconnect AMB client if available
        if (this.ambClient && this.isConnected) {
            try {
                this.ambClient.disconnect()
                console.log('AMB Client disconnected')
            } catch (error) {
                console.error('Error disconnecting AMB client:', error)
            }
            this.isConnected = false
        }
    }
}