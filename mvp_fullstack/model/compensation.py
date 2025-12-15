from sqlalchemy import Column, String, Integer, Float
from model import Base

class Compensation(Base):
    __tablename__ = "federal_compensation"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(140))
    group = Column(String())  
    municipality = Column(String())    # matches Produto.nome
    compensation = Column(Integer)               # e.g. R$, área, etc.

    def __init__(self, name: str, group: str, municipality:str,compensation:int):
        self.name = name
        self.group = group 
        self.municipality = municipality 
        self.compensation = compensation
