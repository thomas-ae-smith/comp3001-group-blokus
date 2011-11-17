from appengine_django.models import BaseModel
from google.appengine.ext import db

class Player(BaseModel):
	name = db.CharField()
	wins = db.IntegerField()
	losses = db.IntegerField()
