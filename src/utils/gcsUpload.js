const SIGNED_URL_FUNCTION = 'https://us-central1-airbnb-rooms.cloudfunctions.net/generate-signed-url';
const BATCH_SIGNED_URL_FUNCTION = 'https://us-central1-airbnb-rooms.cloudfunctions.net/generate-batch-signed-urls';

export const getSignedUrl = async (filePath, action = 'download', contentType = 'image/jpeg') => {
    const response = await fetch(SIGNED_URL_FUNCTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, action, contentType })
    });

    if (!response.ok) {
        throw new Error(`Failed to get signed URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.signedUrl;
};

export const getBatchSignedUrls = async (filePaths) => {
    const response = await fetch(BATCH_SIGNED_URL_FUNCTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths })
    });

    if (!response.ok) {
        throw new Error(`Failed to get batch signed URLs: ${response.statusText}`);
    }

    const data = await response.json();
    return data.urls;
};

export const uploadToGCS = async (file, gcsPath) => {
    const contentType = file.type || 'image/jpeg';

    // Get signed URL for upload
    const signedUrl = await getSignedUrl(gcsPath, 'upload', contentType);

    // Upload file directly to GCS
    const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file
    });

    if (!uploadResponse.ok) {
        throw new Error(`Failed to upload to GCS: ${uploadResponse.statusText}`);
    }

    return gcsPath;
};

export const buildPhotoPath = (hostId, roomId, filename) => {
    return `hosts/${hostId}/rooms/${roomId}/baseline/photos/${filename}`;
};

export const buildCropPath = (hostId, roomId, filename) => {
    return `hosts/${hostId}/rooms/${roomId}/baseline/crops/${filename}`;
};