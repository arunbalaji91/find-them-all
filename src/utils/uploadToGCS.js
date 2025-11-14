const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const uploadToGCS = async (imageBlob, fileName, firebaseToken) => {
    try {
        console.log('🚀 Step 1: Requesting signed URL for:', fileName);
        console.log('   - Blob size:', (imageBlob.size / 1024 / 1024).toFixed(2), 'MB');
        console.log('   - API URL:', API_URL);

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
            const errorData = await signedUrlResponse.json();
            console.error('❌ Step 1 Failed: Signed URL request failed');
            console.error('   - Status:', signedUrlResponse.status);
            console.error('   - Response:', errorData);
            throw new Error(errorData.detail || `Failed to get signed URL: ${signedUrlResponse.status}`);
        }

        const { uploadUrl, gcsPath, publicUrl } = await signedUrlResponse.json();
        console.log('✅ Step 1 Success: Got signed URL');
        console.log('   - GCS Path:', gcsPath);
        console.log('   - Public URL:', publicUrl);

        console.log('🚀 Step 2: Uploading to GCS via signed URL...');
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'image/jpeg'
            },
            body: imageBlob
        });

        if (!uploadResponse.ok) {
            console.error('❌ Step 2 Failed: Upload to GCS failed');
            console.error('   - Status:', uploadResponse.status);
            console.error('   - Status Text:', uploadResponse.statusText);
            throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }

        console.log('✅ Step 2 Success: Image uploaded to GCS');
        console.log('   - File:', gcsPath);
        console.log('   - Size:', (imageBlob.size / 1024 / 1024).toFixed(2), 'MB');

        return { gcsPath, publicUrl };
    } catch (error) {
        console.error('❌ Upload Error:', error.message);
        console.error('   - Full Error:', error);
        throw error;
    }
};