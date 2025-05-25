from starlette.websockets import WebSocket

from data.obj import Game


async def ws_get_game(websocket: WebSocket) -> Game:
    return websocket.app.state.game
