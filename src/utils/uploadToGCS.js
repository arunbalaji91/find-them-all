const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const uploadToGCS = async (imageBlob, fileName, firebaseToken) => {
    try {
        console.log('Requesting signed URL for:', fileName);

        const signedUrlResponse = await fetch(`${API_URL}/api/upload/signed-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${firebaseToken}`
            },
            body: JSON.stringify({
                fileName: fileName,
                contentType: 'image/jpeg'
            })
        });

        if (!signedUrlResponse.ok) {
            const error = await signedUrlResponse.json();
            throw new Error(error.detail || 'Failed to get signed URL');
        }

        const { uploadUrl, gcsPath, publicUrl } = await signedUrlResponse.json();
        console.log('Got signed URL, uploading to GCS...');

        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'image/jpeg'
            },
            body: imageBlob
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
        }

        console.log('Upload successful:', gcsPath);
        return { gcsPath, publicUrl };
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};