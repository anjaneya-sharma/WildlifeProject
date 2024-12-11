"""Some changes p3

Revision ID: 8881dbc7c7d9
Revises: de821e68b544
Create Date: 2024-11-19 13:31:04.119913

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8881dbc7c7d9'
down_revision: Union[str, None] = 'de821e68b544'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('annotations', sa.Column('original_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False))
    op.add_column('annotations', sa.Column('corrected_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False))
    op.drop_column('annotations', 'original_detection')
    op.drop_column('annotations', 'corrected_detection')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('annotations', sa.Column('corrected_detection', postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=False))
    op.add_column('annotations', sa.Column('original_detection', postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=False))
    op.drop_column('annotations', 'corrected_metadata')
    op.drop_column('annotations', 'original_metadata')
    # ### end Alembic commands ###
