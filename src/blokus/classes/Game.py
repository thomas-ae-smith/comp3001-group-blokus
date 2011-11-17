from appengine_django.models import BaseModel
from google.appengine.ext import db

class Game(BaseModel):
    start_time = db.DateTimeField()
	type = db.IntegerField()
