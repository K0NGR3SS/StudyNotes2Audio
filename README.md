# 🎙️ Voice Vault Lambda

Turn your study notes into portable audio using AWS Lambda and Amazon Polly.

This Lambda function is part of the **Voice Vault** project — an AI-powered, serverless system that automatically converts uploaded study notes (text files) into speech using Amazon Polly, and saves the resulting audio back into S3. Think of it as your personal podcast generator for study time.

---

## 🚀 How It Works

1. You upload a `.txt` file to the `notes/` folder in your S3 bucket.
2. An S3 `PUT` event triggers this Lambda function.
3. Lambda:
   - Downloads the text file.
   - Sends the content to Amazon Polly.
   - Receives an audio stream (MP3).
   - Uploads the audio to `audio/` folder in the same bucket.
4. You can now listen to your notes as audio, anywhere.

---

## 📁 Project Structure
