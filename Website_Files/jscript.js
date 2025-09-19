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

// Function to update status with appropriate styling
function updateStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    statusDiv.className = `status-${type}`;
    statusDiv.innerHTML = message;
}

// Function to show loading state
function showLoading(message) {
    const statusDiv = document.getElementById('status');
    statusDiv.className = 'status-info';
    statusDiv.innerHTML = `
        <div class="loading"></div>
        <span style="margin-left: 10px;">${message}</span>
    `;
}

// Async function that is triggered when the user selects and uploads a file
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');

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

    // Disable button during upload
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Processing...";

    try {
        showLoading("Requesting upload URL...");

        // Make GET request with query parameters (matching your Lambda)
        const apiUrl = `YOUR_API_ENDPOINT_HERE?filename=${encodeURIComponent(fileName)}`;
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
        showLoading("Uploading file to S3...");

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
        showLoading("File uploaded successfully! Generating audio...");

        const audioKey = `audio/${fileName.replace('.txt', '.mp3')}`;
        const maxChecks = 15; // Increased from 10 to give more time
        const checkInterval = 3000; // 3 seconds
        let checks = 0;

        while (checks < maxChecks) {
            const exists = await checkAudioExists(bucket, region, audioKey);

            if (exists) {
                const audioUrl = `https://${bucket}.s3.${region}.amazonaws.com/${audioKey}`;
                updateStatus(`
                    <div style="color: #1a4d3a; font-weight: bold; margin-bottom: 10px;">Audio file is ready!</div>
                    <a href="${audioUrl}" target="_blank" class="audio-link">
                        Listen to your audio file
                    </a>
                `, 'success');
                
                // Re-enable button
                uploadBtn.disabled = false;
                uploadBtn.textContent = "🎵 Upload and Convert";
                return;
            }

            checks++;
            showLoading(`Generating audio... (${checks}/${maxChecks})`);
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        // Timeout message with helpful information
        updateStatus(`
            <div style="color: #856404; font-weight: bold; margin-bottom: 10px;">Audio generation is taking longer than expected.</div>
            <div>This might happen with larger files. Please check back in a few minutes.</div>
            <div style="margin-top: 10px; font-size: 0.9em;">Expected audio location: <code>audio/${fileName.replace('.txt', '.mp3')}</code></div>
        `, 'warning');

    } catch (error) {
        console.error('Upload error:', error);
        updateStatus(`
            <div style="font-weight: bold; margin-bottom: 10px;">Error occurred:</div>
            <div>${error.message}</div>
            <div style="font-size: 0.9em; margin-top: 10px; opacity: 0.8;">Check console for more details.</div>
        `, 'error');
    }

    // Re-enable button
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload and Convert";
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const fileLabel = document.getElementById('fileLabel');
    
    if (fileInput && fileLabel) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const fileName = this.files[0].name;
                fileLabel.textContent = `Selected: ${fileName}`;
                fileLabel.classList.add('has-file');
                
                // Clear any previous status
                const statusDiv = document.getElementById('status');
                if (statusDiv) {
                    statusDiv.textContent = '';
                    statusDiv.className = '';
                }
            } else {
                fileLabel.textContent = 'Choose a .txt file to upload';
                fileLabel.classList.remove('has-file');
            }
        });
    }
});