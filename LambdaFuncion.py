import boto3
import os
import urllib.parse
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
polly = boto3.client('polly')

def lambda_handler(event, context): #Context has to be included to match AWS expected handler format
    print("Event: ", event)

    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote(event['Records'][0]['s3']['object']['key'])

    if not key.startswith('notes/'):
        print("Key does not start with 'notes/'")
        return

    audio_key = key.replace('notes/', 'audio/').replace('.txt', '.mp3')

    #Checking for a text file repetition
    try:
        s3.head_object(Bucket=bucket, Key=audio_key)
        print(f"Audio file already exists: {audio_key}")
        return {'status': 'skipped', 'reason': 'Audio already exists', 'audio_key': audio_key}
    except ClientError as e:
        if e.response['Error']['Code'] != "404":
            print("Error checking audio file existence:", e)
            raise

        print(f"Audio file does not exist, generating: {audio_key}")

    response = s3.get_object(Bucket=bucket, Key=key)
    test = response['Body'].read().decode('utf-8')

    # Converting text to speech
    audio_response = polly.synthesize_speech(
        Text=test,
        OutputFormat='mp3',
        VoiceID = 'Joanna'
    )

    s3.upload_fileobj(audio_response['AudioStream'], Bucket= bucket, Key = audio_key)

    return {'status': 'success', 'audio_key': audio_key}