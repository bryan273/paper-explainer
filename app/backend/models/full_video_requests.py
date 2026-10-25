from core.database import Base
from datetime import datetime as PyDateTime
from typing import Optional
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class Full_video_requests(Base):
    __tablename__ = "full_video_requests"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    arxiv_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ui_lang: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    source_arxiv: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[Optional[PyDateTime]] = mapped_column(DateTime(timezone=True), default=PyDateTime.now)
    updated_at: Mapped[Optional[PyDateTime]] = mapped_column(DateTime(timezone=True), default=PyDateTime.now, onupdate=PyDateTime.now)