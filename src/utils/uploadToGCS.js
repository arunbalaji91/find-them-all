/**
 * Upload images to backend with HttpOnly cookie session
 * Backend handles: validation, group creation, Firestore storage, ML processing
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const uploadToGCS = async (imageBlob, fileName, groupName) => {
    try {
        console.log('📤 Uploading image to backend...');
        console.log('   - File:', fileName);
        console.log('   - Group:', groupName);
        console.log('   - Size:', (imageBlob.size / 1024 / 1024).toFixed(2), 'MB');

        // Create FormData with image and group info
        const formData = new FormData();
        formData.append('images', imageBlob, fileName);
        formData.append('groupName', groupName);

        // Send to backend
        // Browser automatically includes HttpOnly session cookie!
        const response = await fetch(`${API_URL}/api/images/upload`, {
            method: 'POST',
            credentials: 'include',  // 🔐 IMPORTANT: Include HttpOnly session cookie
            // DON'T set Content-Type header - browser will set it with boundary
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Upload failed:', error.detail || error.message);
            throw new Error(error.detail || 'Upload failed');
        }

        const data = await response.json();
        console.log('✅ Upload successful');
        console.log('   - Group ID:', data.groupId);
        console.log('   - Status:', data.status);

        return {
            groupId: data.groupId,
            gcsPath: data.gcsPath,  // If backend returns this
            publicUrl: data.publicUrl  // If backend returns this
        };

    } catch (error) {
        console.error('❌ Upload Error:', error.message);
        throw error;
    }
};

/**
 * List all groups for current user
 * Browser automatically includes HttpOnly session cookie
 */
export const listGroups = async (limit = 20, offset = 0) => {
    try {
        console.log('📋 Fetching groups...');

        const response = await fetch(
            `${API_URL}/api/images/groups?limit=${limit}&offset=${offset}`,
            {
                method: 'GET',
                credentials: 'include'  // 🔐 Include HttpOnly session cookie
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch groups');
        }

        const data = await response.json();
        console.log('✅ Groups fetched:', data.groups.length);

        return data;

    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        throw error;
    }
};

/**
 * Get details for a specific group
 * Includes all images and ML detections
 * Browser automatically includes HttpOnly session cookie
 */
export const getGroupDetails = async (groupId) => {
    try {
        console.log('📖 Fetching group details:', groupId);

        const response = await fetch(
            `${API_URL}/api/images/groups/${groupId}`,
            {
                method: 'GET',
                credentials: 'include'  // 🔐 Include HttpOnly session cookie
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch group details');
        }

        const data = await response.json();
        console.log('✅ Group details fetched');

        return data;

    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        throw error;
    }
};

/**
 * Delete a group (and all its images/detections)
 * Browser automatically includes HttpOnly session cookie
 */
export const deleteGroup = async (groupId) => {
    try {
        console.log('🗑️ Deleting group:', groupId);

        const response = await fetch(
            `${API_URL}/api/images/groups/${groupId}?confirm=true`,
            {
                method: 'DELETE',
                credentials: 'include'  // 🔐 Include HttpOnly session cookie
            }
        );

        if (!response.ok) {
            throw new Error('Failed to delete group');
        }

        const data = await response.json();
        console.log('✅ Group deleted');

        return data;

    } catch (error) {
        console.error('❌ Delete error:', error.message);
        throw error;
    }
};