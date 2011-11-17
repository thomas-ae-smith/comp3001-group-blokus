from appengine_django.models import BaseModel
from google.appengine.ext import db

class Player_Game(BaseModel):
	game_id = db.ForeignKey(Game.id)
	position = db.ForeignKey(Position.id)
	player_id = db.ForeignKey(Player.id)
