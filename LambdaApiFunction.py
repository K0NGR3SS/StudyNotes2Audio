import boto3
import os
import json

s3 = boto3.client('s3')


bucket_name = 'target-bucket32134'

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        filename = body['filename']

        if not filename.endswith('.txt'):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Only .txt files are supported'})
            }

        key = f"notes/files/{filename}"

        url = s3.generate_presigned_url(
            'put_object',
            Params = {'Bucket': bucket_name, 'Key': key, 'ContentType': 'text/plain'},
            ExpiresIn = 600
        )
        #Modified the Lambda to use Get file
        return {
            'statusCode': 200,
            'body': json.dumps({
                'uploadUrl': url,
                'bucket': bucket_name,
                'region': 'eu-west-1',
                'key': key
            }),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': '*'
            }
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }