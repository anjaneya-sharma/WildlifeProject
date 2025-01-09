from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = 'postgresql+psycopg2://postgres:your_password@localhost:5432/Wildlife-Monitoring'
engine = create_engine(DATABASE_URL, echo = True)
SessionLocal = sessionmaker(autocommit = False, autoflush = False, bind = engine)
