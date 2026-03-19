# backend/api/views/ai_proxy.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny  # Change to IsAuthenticated if login required
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import requests
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])  # Or [IsAuthenticated] to require login
def claude_proxy(request):
    """
    Secure proxy to Claude API.
    
    SECURITY:
    - Hides API key from frontend (key only exists on backend)
    - Adds rate limiting capability
    - Logs usage for monitoring
    - Can add authentication requirement if needed
    
    Request: { message: string, system?: string }
    Response: { content: string }
    """
    user_message = request.data.get('message')
    system_prompt = request.data.get('system', 'You are a helpful assistant.')
    
    if not user_message:
        return Response(
            {'error': 'Message required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get API key from settings (environment variable)
    api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
    if not api_key or api_key == 'your-openai-key':
        logger.error("Anthropic API key not configured")
        return Response(
            {'error': 'AI service unavailable'}, 
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        # Call Claude API from backend (key is hidden from frontend)
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
                'system': system_prompt,
                'messages': [{'role': 'user', 'content': user_message}]
            },
            timeout=30
        )
        
        response.raise_for_status()
        data = response.json()
        
        # Extract text content from response
        ai_text = "".join(
            block.get('text', '') 
            for block in data.get('content', []) 
            if block.get('type') == 'text'
        )
        
        # Log usage (don't log message content for privacy)
        logger.info(f"Claude API used by {request.user if request.user.is_authenticated else 'anonymous'}")
        
        return Response({'content': ai_text})
        
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