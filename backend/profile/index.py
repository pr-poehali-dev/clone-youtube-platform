import json
import os
import base64
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3
import uuid

def handler(event: dict, context) -> dict:
    '''API для управления профилем пользователя и каналом'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )
    
    try:
        if method == 'GET':
            query_params = event.get('queryStringParameters', {}) or {}
            user_id = query_params.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'user_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('SELECT * FROM users WHERE id = %s', (user_id,))
            user = cur.fetchone()
            
            cur.execute('SELECT COUNT(*) as video_count FROM videos WHERE user_id = %s', (user_id,))
            video_count = cur.fetchone()['video_count']
            
            cur.execute('SELECT COALESCE(SUM(views), 0) as total_views FROM videos WHERE user_id = %s', (user_id,))
            total_views = cur.fetchone()['total_views']
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    **dict(user),
                    'video_count': video_count,
                    'total_views': total_views
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            channel_name = body.get('channel_name')
            avatar_base64 = body.get('avatar_base64')
            
            avatar_url = None
            if avatar_base64:
                avatar_data = base64.b64decode(avatar_base64)
                avatar_key = f'avatars/{uuid.uuid4()}.jpg'
                s3.put_object(Bucket='files', Key=avatar_key, Body=avatar_data, ContentType='image/jpeg')
                avatar_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{avatar_key}"
            
            if avatar_url:
                cur.execute('''
                    UPDATE users 
                    SET channel_name = %s, avatar_url = %s
                    WHERE id = %s
                    RETURNING *
                ''', (channel_name, avatar_url, user_id))
            else:
                cur.execute('''
                    UPDATE users 
                    SET channel_name = %s
                    WHERE id = %s
                    RETURNING *
                ''', (channel_name, user_id))
            
            user = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(user), default=str),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid request'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
