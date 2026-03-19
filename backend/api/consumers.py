import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        # Reject anonymous users
        if self.user.is_anonymous:
            await self.close()
            return
        
        self.group_name = f"user_{self.user.id}_notifications"
        
        # Join user-specific group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": "Connected to notifications"
        }))

    async def disconnect(self, close_code):
        # Leave group if we joined
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            await self.send(text_data=json.dumps({
                "type": "echo",
                "data": data
            }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid JSON"
            }))

    async def notification_message(self, event):
        """Handler for messages sent to the group"""
        await self.send(text_data=json.dumps({
            "type": "notification",
            "message": event["message"]
        }))