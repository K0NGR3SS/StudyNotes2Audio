# Voice Vault Lambda

Turn your study notes into portable audio using AWS Lambda and Amazon Polly.

This Lambda function is part of the **Voice Vault** project — an AI-powered, serverless system that automatically converts uploaded study notes (text files) into speech using Amazon Polly, and saves the resulting audio back into S3. Think of it as your personal podcast generator for study time.

---

## How It Works

1. You upload a `.txt` file to the `notes/` folder in your S3 bucket.
2. An S3 `PUT` event triggers this Lambda function.
3. Lambda:
   - Downloads the text file.
   - Sends the content to Amazon Polly.
   - Receives an audio stream (MP3).
   - Uploads the audio to `audio/` folder in the same bucket.
4. You can now listen to your notes as audio, anywhere.

---

## Requirements

- Python 3.8+
- AWS CLI configured
- AWS resources:
  - S3 bucket
  - Lambda function with execution role
  - Amazon Polly permissions
  - S3 trigger on `notes/` prefix

---

## Setup Instructions

1. **Create your S3 bucket**  
   Example: `voice-vault-study`

2. **Create an IAM role** for Lambda with the following permissions:
   - `AmazonPollyFullAccess`
   - `AmazonS3FullAccess` *(you can restrict later)*

3. **Deploy the Lambda function**  
   Upload the `lambda_function.py` to your Lambda, using Python 3.x runtime.

4. **Add S3 Trigger**  
   Configure an S3 event trigger:
   - Event type: `PUT`
   - Prefix: `notes/`
   - Suffix: `.txt`

5. **Upload a text file to test**  
   Upload `notes/physics1.txt` — check if `audio/physics1.mp3` appears!

---

## Future Features (Ideas)

- S3 public pre-signed audio links
- Frontend web uploader
- Language detection + voice matching
- Reverse mode: Audio → Transcribed Notes via Amazon Transcribe


