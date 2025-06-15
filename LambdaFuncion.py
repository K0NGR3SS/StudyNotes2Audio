import boto3
import os
import urllib.parse

s3 = boto3.client('s3')
polly = boto3.client('polly')

#Name of bucket for audio upload
target_bucket = 'Target audio bucket name'

def lambda_handler(event, context):
    print("Event: ", event)

    text_bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote(event['Records'][0]['s3']['object']['key'])

    if not key.startswith('notes/'):
        print("Key does not start with 'notes/'")
        return {'status': 'skipped', 'reason': 'Key does not start with "notes/"'}

    # Reading of .txt files
    response = s3.get_object(Bucket=text_bucket, Key=key)
    test = response['Body'].read().decode('utf-8')

    # Converting text to speech using Amazon Polly
    audio_response = polly.synthesize_speech(
        Text=test,
        OutputFormat='mp3',
        VoiceID = 'Joanna'
    )

    #Forming the key for audio file
    audio_key = key.replace('notes/', 'audio/').replace('.txt', '.mp3')

    #Uploading MP3 into different bucket
    s3.upload_fileobj(
        fileobj = audio_response['AudioStream'],
        Bucket = target_bucket,
        Key = audio_key
    )

    return {
        'status': 'success',
        'text_bucket': text_bucket,
        'audio_bucket': target_bucket,
        'audio_key': audio_key
    }