import json
import os
import base64
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3
import uuid
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для загрузки, получения и управления видео'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
            category = query_params.get('category')
            search = query_params.get('search')
            
            query = '''
                SELECT v.*, u.name as channel_name, u.avatar_url as channel_avatar, u.subscribers
                FROM videos v
                JOIN users u ON v.user_id = u.id
                WHERE 1=1
            '''
            params = []
            
            if user_id:
                query += ' AND v.user_id = %s'
                params.append(user_id)
            
            if category and category != 'Все':
                query += ' AND v.category = %s'
                params.append(category)
            
            if search:
                query += ' AND (v.title ILIKE %s OR v.description ILIKE %s OR u.name ILIKE %s)'
                search_pattern = f'%{search}%'
                params.extend([search_pattern, search_pattern, search_pattern])
            
            query += ' ORDER BY v.created_at DESC'
            
            cur.execute(query, params)
            videos = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps([dict(v) for v in videos], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'upload':
                user_id = body.get('user_id')
                title = body.get('title')
                description = body.get('description', '')
                category = body.get('category', 'Разное')
                video_base64 = body.get('video_base64')
                thumbnail_base64 = body.get('thumbnail_base64', '')
                
                video_data = base64.b64decode(video_base64)
                video_key = f'videos/{uuid.uuid4()}.mp4'
                s3.put_object(Bucket='files', Key=video_key, Body=video_data, ContentType='video/mp4')
                video_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{video_key}"
                
                thumbnail_url = ''
                if thumbnail_base64:
                    thumbnail_data = base64.b64decode(thumbnail_base64)
                    thumbnail_key = f'thumbnails/{uuid.uuid4()}.jpg'
                    s3.put_object(Bucket='files', Key=thumbnail_key, Body=thumbnail_data, ContentType='image/jpeg')
                    thumbnail_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{thumbnail_key}"
                
                cur.execute('''
                    INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, category, views, real_views)
                    VALUES (%s, %s, %s, %s, %s, %s, 100, 0)
                    RETURNING *
                ''', (user_id, title, description, video_url, thumbnail_url, category))
                video = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(dict(video), default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'view':
                video_id = body.get('video_id')
                user_id = body.get('user_id')
                ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', '')
                
                cur.execute('SELECT * FROM videos WHERE id = %s', (video_id,))
                video = cur.fetchone()
                
                if video:
                    cur.execute('''
                        INSERT INTO video_views (video_id, user_id, ip_address)
                        VALUES (%s, %s, %s)
                    ''', (video_id, user_id, ip_address))
                    
                    new_real_views = video['real_views'] + 1
                    boost_multiplier = 10
                    new_total_views = video['views'] + boost_multiplier
                    
                    cur.execute('''
                        UPDATE videos 
                        SET views = %s, real_views = %s
                        WHERE id = %s
                    ''', (new_total_views, new_real_views, video_id))
                    
                    if new_total_views >= 1000 and video['views'] < 1000:
                        cur.execute('''
                            UPDATE users 
                            SET subscribers = subscribers + 100
                            WHERE id = %s
                        ''', (video['user_id'],))
                    elif new_total_views >= 5000 and video['views'] < 5000:
                        cur.execute('''
                            UPDATE users 
                            SET subscribers = subscribers + 500
                            WHERE id = %s
                        ''', (video['user_id'],))
                    elif new_total_views >= 10000 and video['views'] < 10000:
                        cur.execute('''
                            UPDATE users 
                            SET subscribers = subscribers + 1000
                            WHERE id = %s
                        ''', (video['user_id'],))
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'views': new_total_views, 'real_views': new_real_views}),
                        'isBase64Encoded': False
                    }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            video_id = body.get('video_id')
            title = body.get('title')
            description = body.get('description')
            category = body.get('category')
            
            cur.execute('''
                UPDATE videos 
                SET title = %s, description = %s, category = %s, updated_at = %s
                WHERE id = %s
                RETURNING *
            ''', (title, description, category, datetime.now(), video_id))
            video = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(video), default=str),
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
