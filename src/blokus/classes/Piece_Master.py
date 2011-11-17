from appengine_django.models import BaseModel
from google.appengine.ext import db

class Piece_Master(BaseModel):
	piece_data = BlobField()
