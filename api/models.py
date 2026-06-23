from sqlalchemy import Column, Integer, String, Text
from .db import Base

class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    arabic_name = Column(String, index=True)
    arabic_notes = Column(Text)
    french_name = Column(String, index=True)
    french_notes = Column(Text)
    scientific_name = Column(String, index=True)
    region = Column(Text)
    part_used = Column(Text)
    composition = Column(Text)
    composition_tags = Column(String)
    biological_activity = Column(Text)
    activity_tags = Column(String)
    family = Column(String)
    author = Column(String)
