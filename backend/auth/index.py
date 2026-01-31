import json
import os
import jwt
import time
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для авторизации пользователей через OAuth (Google/Яндекс) и управления сессиями'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'oauth_callback':
                provider = body.get('provider')
                oauth_id = body.get('oauth_id')
                email = body.get('email')
                name = body.get('name')
                avatar_url = body.get('avatar_url', '')
                
                cur.execute('''
                    SELECT * FROM users 
                    WHERE oauth_provider = %s AND oauth_id = %s
                ''', (provider, oauth_id))
                user = cur.fetchone()
                
                if not user:
                    channel_name = f"Канал {name}"
                    cur.execute('''
                        INSERT INTO users (email, name, avatar_url, channel_name, oauth_provider, oauth_id)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING *
                    ''', (email, name, avatar_url, channel_name, provider, oauth_id))
                    user = cur.fetchone()
                    conn.commit()
                
                token = jwt.encode({
                    'user_id': user['id'],
                    'email': user['email'],
                    'exp': datetime.utcnow() + timedelta(days=30)
                }, 'secret_key_change_in_production', algorithm='HS256')
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'token': token,
                        'user': dict(user)
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'verify_token':
                token = body.get('token')
                try:
                    payload = jwt.decode(token, 'secret_key_change_in_production', algorithms=['HS256'])
                    cur.execute('SELECT * FROM users WHERE id = %s', (payload['user_id'],))
                    user = cur.fetchone()
                    
                    if user:
                        return {
                            'statusCode': 200,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'user': dict(user)}),
                            'isBase64Encoded': False
                        }
                except jwt.ExpiredSignatureError:
                    pass
                
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Invalid token'}),
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
