from appengine_django.models import BaseModel
from google.appengine.ext import db

class Position_Colour(BaseModel):
	colour = db.IntegerField()
