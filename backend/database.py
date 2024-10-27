
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL : str = 'postgresql+psycopg2://postgres:88x7kt3b88@localhost:5432/Wildlife-Monitoring'
engine = create_engine(DATABASE_URL, echo = True)
SessionLocal = sessionmaker(autocommit = False, autoflush = False, bind = engine)
