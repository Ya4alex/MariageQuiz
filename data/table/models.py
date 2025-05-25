import enum
from typing import List, Dict

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


class ScreenResults(BaseModel):
    winers: List[TableResult]
    category_winners: Dict[str, TableResult | None]
