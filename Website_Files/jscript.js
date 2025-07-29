// Async function that checks for existence of the MP3 file in the S3 Bucket
async function checkAudioExists(bucket, region, audioKey) {
    const audioUrl = `https://${bucket}.s3.${region}.amazonaws.com/${audioKey}`;

    try {
        const response = await fetch(audioUrl, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error('Error checking audio file:', error);
        return false;
    }
}

// Async function that is triggered when the user selects and uploads a file
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');

    // Validate file selection
    if (!fileInput.files.length) {
        alert("Please select a .txt file to upload.");
        return;
    }

    const file = fileInput.files[0];
    const fileName = file.name;

    // Validate file type
    if (!fileName.endsWith('.txt')) {
        alert("Please select a .txt file only.");
        return;
    }

    try {
        statusDiv.textContent = "Requesting upload URL...";

        // Make GET request with query parameters (matching your Lambda)
        const apiUrl = `https://st4t9wui69.execute-api.eu-west-1.amazonaws.com/prod?filename=${encodeURIComponent(fileName)}`;
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get presigned URL: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Check if we got the expected data
        if (!data.uploadURL || !data.bucket || !data.region) {
            throw new Error("Invalid response from API - missing required fields");
        }

        const uploadURL = data.uploadURL;
        const bucket = data.bucket;
        const region = data.region;

        // Upload file directly to S3 using the pre-signed URL
        statusDiv.textContent = "Uploading file to S3...";

        const uploadResponse = await fetch(uploadURL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: file
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status} - ${uploadResponse.statusText}`);
        }

        // Wait for audio file generation
        statusDiv.textContent = "File uploaded successfully! Waiting for audio to be generated...";

        const audioKey = `audio/${fileName.replace('.txt', '.mp3')}`;
        const maxChecks = 15; // Increased from 10 to give more time
        const checkInterval = 3000; // 3 seconds
        let checks = 0;

        while (checks < maxChecks) {
            const exists = await checkAudioExists(bucket, region, audioKey);

            if (exists) {
                const audioUrl = `https://${bucket}.s3.${region}.amazonaws.com/${audioKey}`;
                statusDiv.innerHTML = `
                    <div style="color: green; font-weight: bold;">✅ Audio file is ready!</div>
                    <br>
                    <a href="${audioUrl}" target="_blank" style="color: #4CAF50; text-decoration: none; font-weight: bold;">
                        🎧 Listen to your audio file
                    </a>
                `;
                return;
            }

            checks++;
            statusDiv.textContent = `File uploaded successfully! Checking for audio... (${checks}/${maxChecks})`;
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        // Timeout message with helpful information
        statusDiv.innerHTML = `
            <div style="color: orange;">⏱️ Audio generation is taking longer than expected.</div>
            <br>
            <div>This might happen with larger files. Please check back in a few minutes.</div>
            <br>
            <div>Expected audio location: <code>audio/${fileName.replace('.txt', '.mp3')}</code></div>
        `;

    } catch (error) {
        console.error('Upload error:', error);
        statusDiv.innerHTML = `
            <div style="color: red; font-weight: bold;">❌ Error occurred:</div>
            <br>
            <div>${error.message}</div>
            <br>
            <div style="font-size: 0.9em; color: #666;">Check console for more details.</div>
        `;
    }
}

// Add event listener for Enter key on file input
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const statusDiv = document.getElementById('status');
            if (statusDiv && this.files.length > 0) {
                statusDiv.textContent = `Selected: ${this.files[0].name}`;
            }
        });
    }
});
