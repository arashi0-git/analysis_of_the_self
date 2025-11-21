from pydantic import BaseModel


class MemoCreate(BaseModel):
    text: str
