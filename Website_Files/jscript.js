//Async function that checks for existence of the MP3 file in the S3 Bucket
async function checkAudioExists(bucket, region, audioKey) {
    const audioUrl = `https://${bucket}.s3.${region}.amazonaws.com/${audioKey}`;

    try {
        const res = await fetch(audioUrl, {method: 'HEAD'});//HEAD is more lightweight and doesn't install the file
        return res.ok;
    }
    catch {
        return false;
    }
}
//Async function that is triggered when the user selects and uploads a file
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');

    if(!fileInput.files.length) {
        alert("Please select a .txt file to upload.");
        return;
    }

    const file = fileInput.files[0];
    const fileName = file.name;

    try {
        statusDiv.textContent = "Requesting upload URL...";

        const response = await fetch('https://st4t9wui69.execute-api.eu-west-1.amazonaws.com/prod?filename=' + encodeURIComponent(fileName));

        if (!response.ok) throw new Error("Failed to get presigned URL");

        const data = await response.json();
        const uploadURL = data.uploadURL;
        const bucket = data.bucket;
        const region = data.region;

        //Uploads directly to S3 using the pre-signed uploadURL
        statusDiv.textContent = "Uploading file to S3...";
        await fetch(uploadURL, {
            method: 'PUT',
            headers: {'Content-Type': 'text/plain'},
            body: file
        });
        //Waiting for audio file and checking the current state of audio file
        statusDiv.textContent = "File uploaded. Waiting for audio to be generated...";

        const audioKey = `audio/${fileName.replace('.txt', '.mp3')}`;

        const maxChecks = 10;
        let checks = 0;

        while (checks < maxChecks) {
            const exists = await checkAudioExists(bucket, region, audioKey);
            if (exists) {
                statusDiv.innerHTML = `Audio file is ready! <br>
                    <a href = "https://${bucket}.s3.${region}.amazonaws.com/${audioKey}\" target=\"_blank\"> Listen to the audio</a>`;
                return;
            }
            await new Promise(res => setTimeout(res, 3000));
            checks++;
        }

        statusDiv.textContent = "Timeout. your audio file is not yet ready.Try again shortly.";

    }
    //Error handling, displaying error message
    catch (err) {
        console.error(err);
        statusDiv.textContent = "Error: " + err.message;
    }
}