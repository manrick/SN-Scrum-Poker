import React, { useState, useEffect } from 'react';
import './StorySelector.css';

export default function StorySelector({ service, onStorySelected }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading stories...');
      const response = await service.getStories();
      console.log('Stories response received:', response);
      
      // Handle both direct array and wrapped object response
      const storiesData = response.stories || response || [];
      console.log('Processed stories data:', storiesData);
      
      // Ensure we have an array
      if (Array.isArray(storiesData)) {
        console.log(`Setting ${storiesData.length} stories`);
        setStories(storiesData);
        if (storiesData.length === 0) {
          setError('No active stories found. Create some stories in the rm_story table to use for estimation.');
        }
      } else {
        console.error('Invalid stories data format:', storiesData);
        setStories([]);
        setError('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      setError(`Failed to load stories: ${error.message}`);
      setStories([]); // Ensure stories is always an array
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to safely extract story properties
  const getSafeValue = (field) => {
    if (!field) return null;
    if (typeof field === 'object' && field.display_value !== undefined) {
      return field.display_value;
    }
    if (typeof field === 'object' && field.value !== undefined) {
      return field.value;
    }
    return field;
  };

  const getSafeStoryId = (story) => getSafeValue(story?.sys_id);
  const getSafeNumber = (story) => getSafeValue(story?.number);
  const getSafeShortDescription = (story) => getSafeValue(story?.short_description);
  const getSafeDescription = (story) => getSafeValue(story?.description);
  const getSafeStoryPoints = (story) => getSafeValue(story?.story_points);

  // Defensive programming: ensure stories is always an array before filtering
  const safeStories = Array.isArray(stories) ? stories : [];
  
  const filteredStories = safeStories.filter(story => {
    if (!searchTerm) return true;
    
    const number = getSafeNumber(story);
    const shortDesc = getSafeShortDescription(story);
    
    return (
      number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortDesc?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleStoryClick = (story) => {
    onStorySelected({
      sys_id: getSafeStoryId(story),
      number: getSafeNumber(story),
      short_description: getSafeShortDescription(story),
      description: getSafeDescription(story)
    });
  };

  if (loading) {
    return <div className="story-selector loading">Loading stories...</div>;
  }

  if (error) {
    return (
      <div className="story-selector error">
        <p>{error}</p>
        <button onClick={loadStories}>Retry</button>
      </div>
    );
  }

  return (
    <div className="story-selector">
      <h3>Select a Story to Estimate</h3>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search stories by number or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {safeStories.length > 0 && (
        <div className="story-count">
          Showing {filteredStories.length} of {safeStories.length} stories
        </div>
      )}

      <div className="stories-list">
        {filteredStories.length === 0 ? (
          <div className="no-stories">
            {searchTerm ? 
              'No stories match your search. Try a different search term.' : 
              safeStories.length === 0 ?
                'No stories available for estimation.' :
                'No stories found.'
            }
          </div>
        ) : (
          filteredStories.map(story => {
            const storyId = getSafeStoryId(story);
            const number = getSafeNumber(story);
            const shortDesc = getSafeShortDescription(story);
            const currentPoints = getSafeStoryPoints(story);

            return (
              <div 
                key={storyId}
                className="story-card"
                onClick={() => handleStoryClick(story)}
              >
                <div className="story-header">
                  <span className="story-number">{number || 'N/A'}</span>
                  {currentPoints && (
                    <span className="current-points">{currentPoints} pts</span>
                  )}
                </div>
                <div className="story-title">{shortDesc || 'No description'}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}