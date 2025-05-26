from typing import List

from pydantic import BaseModel

from data.table.models import ClientRole, Question, GameState, ScreenResults, ToTableResult, TableData


class BaseWsEvent(BaseModel):
    event_type: str


# from server --------------------------------------------

class TableEvent(BaseWsEvent, TableData):
    event_type: str = "table"
    role: ClientRole
    question: Question | None = None
    result: ToTableResult | None = None


class ErrorEvent(BaseWsEvent):
    event_type: str = "error"
    error: str


# from client --------------------------------------------
class FromClientEventTypes:
    from_set_table_name = "from_set_table_name"
    from_set_table_answers = "from_set_table_answers"
    from_answer_question = "from_answer_question"


class FromSetTableNameEvent(BaseWsEvent):
    event_type: str = FromClientEventTypes.from_set_table_name
    table_name: str


class FromSetTableAnswersEvent(BaseWsEvent):
    event_type: str = FromClientEventTypes.from_set_table_answers
    table_answers: List[int]


class FromAnswerQuestionEvent(BaseWsEvent):
    event_type: str = FromClientEventTypes.from_answer_question
    table_answers: List[int]


# from admin
class FromAdminEventTypes:
    from_admin_resize_tables = "from_admin_resize_tables"
    from_admin_change_leader = "from_admin_change_leader"
    from_admin_start_game = "from_admin_start_game"
    from_admin_show_answers = "from_admin_show_answers"
    from_admin_previous_question = "from_admin_previous_question"
    from_admin_next_question = "from_admin_next_question"
    from_admin_show_results = "from_admin_show_results"
    from_admin_reset_game = "from_admin_reset_game"

    from_admin_next_step = "from_admin_next_step"


class ResizeTablesEvent(BaseWsEvent):
    event_type: str = FromAdminEventTypes.from_admin_resize_tables
    count: int


class FromAdminChangeLeaderEvent(BaseWsEvent):
    event_type: str = FromAdminEventTypes.from_admin_change_leader
    table_id: int


class FromAdminStartGameEvent(BaseWsEvent):
    event_type: str = FromAdminEventTypes.from_admin_start_game


class FromAdminShowAnswersEvent(BaseWsEvent):
    event_type: str = FromAdminEventTypes.from_admin_show_answers


class FromAdminPreviousQuestionEvent(BaseWsEvent):
    event_type: str = FromAdminEventTypes.from_admin_previous_question


class FromAdminNextQuestionEvent(BaseWsEvent):
    event_type: str = FromAdminEventTypes.from_admin_next_question


class FromAdminResetGameEvent(BaseWsEvent):
    event_type: str = FromAdminEventTypes.from_admin_reset_game


class FromAdminResultsEvent(BaseWsEvent):
    event_type: str = FromAdminEventTypes.from_admin_show_results


class FromAdminNextStepEvent(BaseWsEvent):
    event_type: str = FromAdminEventTypes.from_admin_next_step


# to screen

class ScreenTablesStateEvent(BaseWsEvent):
    event_type: str = "screen_tables_state"
    game_state: GameState
    tables: List[TableData]
    question: Question | None = None
    results: ScreenResults | None = None


class ScreenTableAnsweredEvent(BaseWsEvent):
    event_type: str = "screen_table_answered"
    table_id: int
    table_name: str | None = None
    last: bool = False
