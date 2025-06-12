import boto3
import os
import urllib.parse

s3 = boto3.client('s3')
polly = boto3.client('polly')

def lambda_handler(event, context): #Context has to be included to match AWS expected handler format
    print("Event: ", event)

    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote(event['Records'][0]['s3']['object']['key'])

    if not key.startswith('notes/'):
        print("Key does not start with 'notes/'")
        return

    response = s3.get_object(Bucket=bucket, Key=key)
    test = response['Body'].read().decode('utf-8')

    # Converting text to speech
    audio_response = polly.synthesize_speech(
        Text=test,
        OutputFormat='mp3',
        VoiceID = 'Joanna'
    )

    audio_key = key.replace('notes/', 'audio/').replace('.txt', '.mp3')
    s3.upload_fileobj(audio_response['AudioStream'], Bucket= bucket, Key = audio_key)

    return {'status': 'success', 'audio_key': audio_key}