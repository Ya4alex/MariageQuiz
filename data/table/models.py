import enum
from typing import List, Dict, Tuple

from pydantic import BaseModel


class ClientRole(enum.Enum):
    leader = "leader"
    observer = "observer"


class TableState(enum.Enum):
    waiting_leader = "waiting_leader"
    waiting_game_start = "waiting_game_start"
    in_question = "in_question"
    in_answers = "in_answers"
    in_results = "in_results"


class GameState(enum.Enum):
    waiting = "waiting"
    in_question = "in_question"
    in_answers = "in_answers"
    in_results = "in_results"


import enum


class QuestionType(enum.Enum):
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"


class TableData(BaseModel):
    table_id: int
    table_name: str | None = None
    table_state: TableState
    clients: int
    table_answers: List[int] | None = None
    answered: bool | None = None

class Question(BaseModel):
    id: int
    categories: List[str]
    question_type: QuestionType
    question: str
    images: List[str] = []
    answer_images: List[str] = []
    answers: List[str]
    correct_answers: List[int]
    score: float
    timer: float
    time_left: float


class TableResult(BaseModel):
    table_id: int
    table_name: str | None
    score: float
    categories: Dict[str, float]
    answers: Dict[int, List[int]]


class ToTableResult(BaseModel):
    score: float
    question_score: Dict[int, float]
    categories: Dict[str, float]
    answers: Dict[int, List[int]]
    questions: List[Question]

    place: int | None
    place_categories: Dict[str, int] | None
    place_amount: int


class ScreenResults(BaseModel):
    winers: List[TableResult]
    category_winners: Dict[str, TableResult | None]
