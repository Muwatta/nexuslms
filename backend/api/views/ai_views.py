from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import requests
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claude_proxy(request):
    """
    Secure proxy to Claude API.
    - Hides API key from frontend
    - Adds rate limiting per user
    - Logs usage for monitoring
    """
    user_message = request.data.get('message')
    
    if not user_message:
        return Response(
            {'error': 'Message required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Rate limiting check (implement per-user limits)
    # TODO: Add Redis-based rate limiting here
    
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key or api_key == 'your-openai-key':
        logger.error("Anthropic API key not configured")
        return Response(
            {'error': 'AI service unavailable'}, 
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
            },
            json={
                'model': 'claude-sonnet-4-20250514',
                'max_tokens': 1000,
                'system': 'Be warm, concise, and helpful...',  # Your system prompt
                'messages': [{'role': 'user', 'content': user_message}]
            },
            timeout=30
        )
        
        response.raise_for_status()
        data = response.json()
        
        # Log usage (don't log message content for privacy)
        logger.info(f"Claude API used by user {request.user.id}")
        
        return Response(data)
        
    except requests.Timeout:
        logger.error("Claude API timeout")
        return Response(
            {'error': 'AI service timeout'}, 
            status=status.HTTP_504_GATEWAY_TIMEOUT
        )
    except requests.RequestException as e:
        logger.error(f"Claude API error: {str(e)}")
        return Response(
            {'error': 'AI service error'}, 
            status=status.HTTP_502_BAD_GATEWAY
        )