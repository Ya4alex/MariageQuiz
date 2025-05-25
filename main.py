from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, Depends, WebSocketDisconnect
from starlette.responses import FileResponse
from starlette.staticfiles import StaticFiles

from data.obj import Game, AdminClient, ScreenClient
from dependenses import ws_get_game


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _app.state.game = Game()
    _app.state.admin = None
    yield


app = FastAPI(debug=True, lifespan=lifespan)


@app.websocket("/ws/table/{table_id}")
async def table_websocket(
        websocket: WebSocket,
        table_id: int,
        game: Game = Depends(ws_get_game)
):
    await websocket.accept()

    table = game.get_table(table_id)
    if table is None:
        await websocket.send_text(f"Table {table_id} not found")
        await websocket.close()
        return

    client = await table.add_client(websocket)

    try:
        while True:
            data = await websocket.receive_json()
            await client.ws_handler(data)
    except WebSocketDisconnect:
        await table.remove_client(client)


@app.websocket("/ws/admin")
async def admin_websocket(
        websocket: WebSocket,
        game: Game = Depends(ws_get_game)
):
    # if websocket.app.state.admin is not None:
    #     await websocket.close(code=1008, reason="Already connected")
    #     return

    admin = AdminClient(game, websocket)
    # websocket.app.state.admin = admin

    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            await admin.ws_handler(data)
    except WebSocketDisconnect:
        pass


@app.websocket("/ws/screen")
async def screen_websocket(
        websocket: WebSocket,
        game: Game = Depends(ws_get_game)
):
    await websocket.accept()
    screen = await game.add_screen_client(websocket)
    await screen.send_state()

    try:
        while True:
            data = await websocket.receive_json()
            await screen.ws_handler(data)
    except WebSocketDisconnect:
        await game.remove_screen_client(screen)


# Обслуживание статики React
app.mount("/static", StaticFiles(directory="frontend/dist/static", html=True), name="static")


# Обработка маршрутов React
@app.get("/")
@app.get("/screen")
@app.get("/admin")
@app.get("/table/{table_id}")
async def serve_react_app():
    return FileResponse("frontend/dist/index.html")
