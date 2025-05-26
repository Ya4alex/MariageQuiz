import abc
import asyncio
import json
from typing import List, Dict, Callable, Literal

from fastapi import WebSocket
from starlette.websockets import WebSocketState

from data.question import QuestionManager, Result
from data.table.events import TableEvent, FromSetTableNameEvent, ErrorEvent, FromClientEventTypes, FromAdminEventTypes, \
    FromAnswerQuestionEvent, FromSetTableAnswersEvent, FromAdminChangeLeaderEvent, ScreenTablesStateEvent, TableData, \
    ScreenTableAnsweredEvent, ResizeTablesEvent
from data.table.models import TableState, ClientRole, GameState, TableResult, ScreenResults, ToTableResult


class Client(abc.ABC):
    def __init__(self, table: 'Table', connection: WebSocket, role: ClientRole = ClientRole.observer):
        self.table: 'Table' = table
        self.connection = connection
        self.role: ClientRole = role

    async def send_table_event(self):
        question = self.table.game.question_manager.current_question
        if question:
            question = question.get_model()
        data = TableEvent(
            table_id=self.table.id,
            role=self.role,
            clients=len(self.table.observers) + 1,
            table_state=self.table.state,
            table_name=self.table.name,
            question=question,
            table_answers=self.table.table_answers,
            answered=self.table.answered,
            result=self.table.get_to_table_result(),
        ).model_dump(mode="json")
        try:
            await self.connection.send_json(data)
        except Exception as e:
            print(f"Error sending table event: {e}")
            await self.table.remove_client(self)
            try:
                await self.connection.close()
            except Exception as e:
                print(f"Error closing connection: {e}")

    async def handle_set_table_name(self, event_data: dict):
        event = FromSetTableNameEvent(**event_data)
        if self.role != ClientRole.leader:
            await self.connection.send_json(ErrorEvent(error="Not allowed to set table name").model_dump(mode='json'))
            return
        try:
            await self.table.set_name(event.table_name)
        except Exception as e:
            await self.connection.send_json(ErrorEvent(error=str(e)).model_dump(mode='json'))
            return

    async def handle_set_table_answers(self, event_data: dict):
        event = FromSetTableAnswersEvent(**event_data)
        if self.role != ClientRole.leader:
            await self.connection.send_json(ErrorEvent(error="Not allowed to set answers").model_dump(mode='json'))
            return
        try:
            await self.table.set_table_answers(event.table_answers)
        except Exception as e:
            await self.connection.send_json(ErrorEvent(error=str(e)).model_dump(mode='json'))
            return

    async def handle_answer_question(self, event_data: dict):
        event = FromAnswerQuestionEvent(**event_data)
        if self.role != ClientRole.leader:
            await self.connection.send_json(ErrorEvent(error="Not allowed to answer question").model_dump(mode='json'))
        try:
            await self.table.answer_question(event.table_answers)
        except Exception as e:
            await self.connection.send_json(ErrorEvent(error=str(e)).model_dump(mode='json'))
            return

    async def ws_handler(self, event_data: dict):
        event_type = event_data.get("event_type")
        handlers: Dict[Literal, Callable] = {
            FromClientEventTypes.from_set_table_name: self.handle_set_table_name,
            FromClientEventTypes.from_set_table_answers: self.handle_set_table_answers,
            FromClientEventTypes.from_answer_question: self.handle_answer_question,
        }
        handler = handlers.get(event_type)
        if handler:
            await handler(event_data)
        else:
            await self.connection.send_json(
                ErrorEvent(error=f'Unknown event type "{event_type}"').model_dump(mode='json'))


class Table:
    def __init__(self, game: 'Game', table_id: int):
        self.game: 'Game' = game
        self.id = table_id
        self.leader: Client | None = None
        self.observers: List[Client] = []

        self.result = Result()

        self.state = TableState.waiting_leader
        self.name: str | None = None
        self.table_answers: List[int] = []
        self.answered: bool = False

    async def add_client(self, client_ws) -> Client:
        client = Client(self, client_ws)
        if self.leader is None:
            self.leader = client
            client.role = ClientRole.leader
            if self.state == TableState.waiting_leader:
                self.state = TableState.waiting_game_start
        else:
            self.observers.append(client)

        client.table = self

        await client.send_table_event()
        await self.notify_clients()
        await self.game.notify_screens()
        return client

    async def remove_client(self, client):
        if client.role == ClientRole.leader or self.leader == client:
            if self.observers:
                new_leader = self.observers.pop(0)
                new_leader.role = ClientRole.leader
                self.leader = new_leader
                await self.leader.send_table_event()
            else:
                self.leader = None
                if self.state == TableState.waiting_game_start:
                    self.state = TableState.waiting_leader
        elif client in self.observers:
            self.observers.remove(client)

    async def change_leader(self):
        if not self.leader:
            return

        client = self.leader

        await self.remove_client(client)

        if not (client.connection.application_state == WebSocketState.CONNECTED and
                client.connection.client_state == WebSocketState.CONNECTED):
            await client.connection.close()
            print('####### close')
            return
        self.observers.append(client)
        client.role = ClientRole.observer
        await client.send_table_event()

    async def notify_clients(self):
        await asyncio.gather(*[
            client.send_table_event()
            for client in self.observers + ([self.leader] if self.leader else [])
        ])

    async def set_name(self, name: str):
        if len(name) > 30:
            raise ValueError("Название стола не должно превышать 30 символов")
        self.name = name

        # Notify all clients about the new table name
        await self.notify_clients()
        await self.game.notify_screens()

    async def start_game(self):
        self.state = TableState.in_question
        # Notify all clients about the game start
        await self.notify_clients()

    async def set_table_answers(self, table_answers: List[int]):
        if self.state != TableState.in_question:
            raise ValueError("Not in answers")
        question = self.game.question_manager.current_question
        if not question:
            raise ValueError("No current question")
        if question.time_left_with_gap() <= 0:
            raise ValueError("Время вышло")

        self.table_answers = table_answers
        # Notify all clients about the answer
        await self.notify_clients()

    async def answer_question(self, table_answers: List[int]):
        if self.state != TableState.in_question:
            raise ValueError("Not in question")
        question = self.game.question_manager.current_question
        if not question:
            raise ValueError("No current question")
        if question.time_left_with_gap() <= 0:
            raise ValueError("Время вышло")

        self.table_answers = table_answers
        self.answered = True
        self.result.answer_question(question, table_answers)
        # Notify all clients about the answer
        await self.notify_clients()
        await self.game.table_answered_notify(self)

    async def show_answers(self):
        if self.state != TableState.in_question:
            raise ValueError("Not in question")

        self.state = TableState.in_answers
        # Notify all clients about the answer
        await self.notify_clients()

    async def update_question(self):
        self.state = TableState.in_question
        self.table_answers = []
        self.answered = False

        # Notify all clients about the new question
        await self.notify_clients()

    def get_result(self) -> TableResult | None:
        if self.state != TableState.in_results:
            return None

        return TableResult(
            table_id=self.id,
            table_name=self.name,
            score=self.result.score,
            categories={k: v for k, v in self.result.categories.items() if not k.startswith('_')},
            answers=self.result.answers,
        )

    def get_to_table_result(self) -> ToTableResult | None:
        if self.state != TableState.in_results:
            return None

        return ToTableResult(
            score=self.result.score,
            question_score=self.result.question_score,
            categories={k: v for k, v in self.result.categories.items() if not k.startswith('_')},
            answers=self.result.answers,
            questions=[q.get_model() for q in self.game.question_manager.questions],
            place=self.game.get_table_place(self),
            place_categories=self.game.get_table_place_categories(self),
            place_amount=len(self.game.tables),
        )

    async def show_result(self):
        self.state = TableState.in_results
        await self.notify_clients()

    async def reset_table(self):
        self.state = TableState.waiting_leader
        if self.leader:
            await self.leader.connection.close()
            self.leader = None
        for observer in self.observers:
            await observer.connection.close()
        self.observers.clear()
        self.table_answers.clear()
        self.answered = False
        self.result = Result()
        self.name = None

    async def delete(self):
        await self.reset_table()
        await self.game.notify_screens()

    def get_full_table_data(self) -> dict:
        """Вернуть полные данные о столе."""
        return {
            "id": self.id,
            "name": self.name,
            "state": self.state.value,
            "leader": self.leader is not None,
            "observers_count": len(self.observers),
            "table_answers": self.table_answers,
            "answered": self.answered,
            "result": {
                "score": self.result.score,
                "question_score": dict(self.result.question_score),
                "categories": dict(self.result.categories),
                "answers": dict(self.result.answers),
            },
        }


class Game:
    def __init__(self):
        self.tables: dict[int, Table] = {i: Table(self, i) for i in range(1, 9)}
        self.state = GameState.waiting
        self.question_manager = QuestionManager()

        self.screens: List['ScreenClient'] = []

    def get_table(self, table_id: int) -> Table | None:
        return self.tables.get(table_id)

    def calc_results(self) -> ScreenResults | None:
        if self.state != GameState.in_results:
            return None
        table_results = [table.get_result() for table in self.tables.values() if table.get_result()]
        return ScreenResults(
            winers=sorted(table_results, key=lambda x: x.score, reverse=True)[:3],
            category_winners={
                category: max(
                    (tr for tr in table_results if category in tr.categories),
                    key=lambda x: (x.categories[category], x.score),
                    default=None
                ) for category in self.question_manager.categories.keys() if not category.startswith('_')
            }
        )

    def get_table_place(self, table: Table) -> int | None:
        if self.state != GameState.in_results or table.state != TableState.in_results:
            return None
        sorted_tables = sorted(
            self.tables.values(),
            key=lambda t: t.result.score if t.result else 0,
            reverse=True
        )
        for place, sorted_table in enumerate(sorted_tables, start=1):
            if sorted_table.id == table.id:
                return place

        return None

    def get_table_place_categories(self, table: Table) -> Dict[str, int | None] | None:
        if self.state != GameState.in_results or table.state != TableState.in_results:
            return None
        place_categories = {}
        for category in self.question_manager.categories.keys():
            if category.startswith('_'):
                continue
            if category not in table.result.categories:
                place_categories[category] = None

            sorted_tables = sorted(
                self.tables.values(),
                key=lambda t: (t.result.categories[category], table.result.score),
                reverse=True
            )
            for place, sorted_table in enumerate(sorted_tables, start=1):
                if sorted_table.id == table.id:
                    place_categories[category] = place
        return place_categories

    async def resize_tables(self, count: int):
        if count < 0:
            raise ValueError("Invalid table count")

        current_count = len(self.tables)

        if count < current_count:
            # Удаляем лишние столы
            for table_id in range(current_count, count, -1):
                await self.tables[table_id].delete()
                del self.tables[table_id]
        elif count > current_count:
            # Добавляем новые столы
            for table_id in range(current_count + 1, count + 1):
                self.tables[table_id] = Table(self, table_id)

    async def add_screen_client(self, connection: WebSocket):
        screen_client = ScreenClient(self, connection)
        self.screens.append(screen_client)
        return screen_client

    async def remove_screen_client(self, screen_client: 'ScreenClient'):
        self.screens.remove(screen_client)

    async def notify_screens(self):
        await asyncio.gather(*[screen.send_state() for screen in self.screens])

    async def start(self):
        if self.state != GameState.waiting:
            raise ValueError("Game already started")
        self.state = GameState.in_question
        self.question_manager.next_question()
        self.question_manager.current_question.start_timer()
        # Notify all clients about the game start
        await asyncio.gather(*[table.start_game() for table in self.tables.values()])
        await self.notify_screens()

    async def show_answers(self):
        if self.state != GameState.in_question:
            raise ValueError(f"Game not in question state: {self.state}")
        self.state = GameState.in_answers

        await asyncio.gather(*[table.show_answers() for table in self.tables.values()])
        await self.notify_screens()

    async def previous_question(self):
        if self.state != GameState.in_answers and self.state != GameState.in_question:
            raise ValueError("Game not in answers state")
        self.question_manager.previous_question()
        self.state = GameState.in_question
        self.question_manager.current_question.start_timer()
        # Notify all clients about the game start
        await asyncio.gather(*[table.update_question() for table in self.tables.values()])
        await self.notify_screens()

    async def next_question(self):
        if self.state != GameState.in_answers and self.state != GameState.in_question:
            raise ValueError("Game not in answers state")
        self.question_manager.next_question()
        self.state = GameState.in_question
        self.question_manager.current_question.start_timer()
        # Notify all clients about the game start
        await asyncio.gather(*[table.update_question() for table in self.tables.values()])
        await self.notify_screens()

    async def show_results(self):
        self.state = GameState.in_results
        await asyncio.gather(*[table.show_result() for table in self.tables.values()])
        await self.notify_screens()
        self.write_game()  # Сохраняем состояние игры после завершения

    async def reset_game(self):
        self.state = GameState.waiting
        self.question_manager = QuestionManager()
        for table in self.tables.values():
            await table.reset_table()

        await self.notify_screens()

    async def table_answered_notify(self, table: Table):
        last = all(t.answered for t in self.tables.values() if t.state == TableState.in_question)
        await asyncio.gather(*[s.notify_table_answered(table, last=last) for s in self.screens])

    def get_full_game_data(self) -> dict:
        """Вернуть полные данные об игре."""
        return {
            "state": self.state.value,
            "tables": {tid: table.get_full_table_data() for tid, table in self.tables.items()},
            "questions": [q.get_model().model_dump(mode="json") for q in self.question_manager.questions],
            "current_question_index": self.question_manager._QuestionManager__current_index,
            "categories": list(self.question_manager.categories.keys()),
        }

    def write_game(self, path: str = "game_state.json"):
        """Сохранить полные данные об игре в json."""
        data = self.get_full_game_data()
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


class AdminClient:
    def __init__(self, game: Game, connection: WebSocket):
        self.game = game
        self.connection = connection

    async def resize_tables(self, event_data: dict):
        event = ResizeTablesEvent(**event_data)
        await self.game.resize_tables(event.count)

    async def change_leader(self, event_data: dict):
        event = FromAdminChangeLeaderEvent(**event_data)
        table = self.game.get_table(event.table_id)
        if table is None:
            raise ValueError("Table not found")
        await table.change_leader()

    async def start_game(self, event_data: dict):
        await self.game.start()

    async def show_answers(self, event_data: dict):
        await self.game.show_answers()

    async def previous_question(self, event_data: dict):
        await self.game.previous_question()

    async def next_question(self, event_data: dict):
        await self.game.next_question()

    async def show_results(self, event_data: dict):
        await self.game.show_results()

    async def reset_game(self, event_data: dict):
        await self.game.reset_game()

    async def next_step(self, event_data: dict):
        if self.game.state == GameState.waiting:
            await self.game.start()
        elif self.game.state == GameState.in_question:
            await self.game.show_answers()
        elif self.game.state == GameState.in_answers:
            await self.game.next_question()
        else:
            raise ValueError(f"Game not in a valid state for next step: {self.game.state}")

    async def ws_handler(self, event_data: dict):
        event_type = event_data.get("event_type")
        handlers: Dict[Literal, Callable] = {
            FromAdminEventTypes.from_admin_resize_tables: self.resize_tables,
            FromAdminEventTypes.from_admin_change_leader: self.change_leader,
            FromAdminEventTypes.from_admin_start_game: self.start_game,
            FromAdminEventTypes.from_admin_show_answers: self.show_answers,
            FromAdminEventTypes.from_admin_previous_question: self.previous_question,
            FromAdminEventTypes.from_admin_next_question: self.next_question,
            FromAdminEventTypes.from_admin_show_results: self.show_results,
            FromAdminEventTypes.from_admin_reset_game: self.reset_game,
            FromAdminEventTypes.from_admin_next_step: self.next_step,
        }
        handler = handlers.get(event_type)
        if handler:
            try:
                await handler(event_data)
            except Exception as e:
                await self.connection.send_json(ErrorEvent(error=str(e)).model_dump(mode='json'))
        else:
            await self.connection.send_json(ErrorEvent(error="Unknown event type").model_dump(mode='json'))


class ScreenClient:
    def __init__(self, game: Game, connection: WebSocket):
        self.game = game
        self.connection = connection

    async def send_state(self):
        question = self.game.question_manager.current_question
        if question:
            question = question.get_model()
        data = ScreenTablesStateEvent(
            game_state=self.game.state,
            tables=[TableData(
                table_id=table.id,
                table_name=table.name,
                table_state=table.state,
                clients=len(table.observers) + 1 if table.leader else 0,
                table_answers=table.table_answers,
                answered=table.answered,
            ) for table in self.game.tables.values()],
            question=question,
            results=self.game.calc_results()
        ).model_dump(mode="json")
        try:
            await self.connection.send_json(data)
        except Exception as e:
            print(f"Error sending table event: {e}")
            await self.game.remove_screen_client(self)
            try:
                await self.connection.close()
            except Exception as e:
                print(f"Error closing connection: {e}")

    async def notify_table_answered(self, table: Table, last: bool = False):
        await self.connection.send_json(
            ScreenTableAnsweredEvent(
                table_id=table.id,
                table_name=table.name,
                last=last
            ).model_dump(mode='json')
        )

    async def ws_handler(self, event_data: dict):
        pass
