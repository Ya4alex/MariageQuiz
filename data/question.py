import time
from collections import defaultdict
from typing import List, Dict

from data.queststion_conf import QUESTIONS
from data.table.models import Question


class QuestionObject:
    def __init__(self, id: int, data: dict):
        self.id = id
        self.categories: List[str] = data['categories']
        self.question_type = data['question_type']
        self.question = data['question']
        self.images = data['images']
        self.answer_images = data['answer_images']
        self.answers = data['answers']
        self.correct_answers = data['correct_answers']
        self.score = data['score']
        self.timer = data['timer']

        self._time_start: float | None = 0

    def start_timer(self):
        self._time_start = time.time()

    @property
    def time_left(self):
        if self._time_start is None:
            return self.timer
        t = self._time_start + self.timer - time.time()
        if t < 0:
            return 0
        return t

    def time_left_with_gap(self, gap=2):
        if self._time_start is None:
            return self.timer
        t = self.timer - (time.time() - self._time_start) + gap
        if t < 0:
            return 0
        return t

    def get_model(self) -> Question:
        return Question.model_validate(self, from_attributes=True)

    def model_dump(self) -> dict:
        return self.get_model().model_dump(mode='json')


class LastQuestionError(Exception):
    def __init__(self):
        super().__init__("This is the last question, no more questions available.")


class QuestionManager:
    def __init__(self):
        self.questions: List[QuestionObject] = [QuestionObject(i, q) for i, q in enumerate(QUESTIONS)]
        self.categories: Dict[str, List[QuestionObject]] = defaultdict(list)
        for question in self.questions:
            for category in question.categories:
                self.categories[category].append(question)
        self.__current_index: int | None = None

    @property
    def current_question(self) -> QuestionObject | None:
        if self.__current_index is None:
            return None
        return self.questions[self.__current_index]

    def next_question(self) -> QuestionObject | None:
        if self.__current_index is None:
            self.__current_index = -1
        if self.__current_index + 1 >= len(self.questions):
            raise LastQuestionError
        self.__current_index += 1
        return self.questions[self.__current_index]


class Result:
    def __init__(self):
        self.answers: Dict[int, List[int]] = {}
        self.score: float = 0
        self.categories: Dict[str, float] = defaultdict(lambda: 0)

    @staticmethod
    def f1_score_based_points(correct_answers, user_answers, max_points) -> float:
        A = set(correct_answers)
        R = set(user_answers)
        TP = len(A & R)

        if TP == 0:
            return 0.0

        precision = TP / len(R)
        recall = TP / len(A)

        f1 = 2 * precision * recall / (precision + recall)
        return round(max_points * f1, 2)

    def answer_question(self, question: QuestionObject, table_answers: List[int]):
        self.answers[question.id] = table_answers.copy()

        score = self.f1_score_based_points(question.correct_answers, table_answers, question.score)
        self.score += score
        for category in question.categories:
            self.categories[category] += score
        return score
