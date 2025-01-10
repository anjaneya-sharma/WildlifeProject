"""Some changes p200

Revision ID: fc67f5f4e8eb
Revises: 2edafbf7a943
Create Date: 2024-11-24 16:44:22.503019

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fc67f5f4e8eb'
down_revision: Union[str, None] = '2edafbf7a943'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('processed_images', 'file_path')
    op.alter_column('raw_images', 'image_data',
               existing_type=postgresql.BYTEA(),
               nullable=True)
    op.drop_column('raw_images', 'file_path')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('raw_images', sa.Column('file_path', sa.VARCHAR(length=255), autoincrement=False, nullable=False))
    op.alter_column('raw_images', 'image_data',
               existing_type=postgresql.BYTEA(),
               nullable=True)
    op.add_column('processed_images', sa.Column('file_path', sa.VARCHAR(length=255), autoincrement=False, nullable=False))
    # ### end Alembic commands ###