import json
import logging
from typing import List
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class AdminWSManager:
    """
    Manages active WebSocket connections for connected Admin clients.
    Broadcasts real-time events such as user login, logout, registration, and DB maintenance.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AdminWSManager, cls).__new__(cls)
            cls._instance.active_connections: List[WebSocket] = []
        return cls._instance

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Admin WebSocket client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Admin WebSocket client disconnected. Remaining connections: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: dict):
        """
        Broadcasts a JSON message to all connected admin clients.
        """
        if not self.active_connections:
            return

        payload = {
            "type": event_type,
            "data": data
        }
        message_str = json.dumps(payload, default=str)

        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.warning(f"Failed to send WS message to admin client: {e}")
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(connection)


admin_ws_manager = AdminWSManager()
