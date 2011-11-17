from appengine_django.models import BaseModel
from google.appengine.ext import db

#TODO: set limits on the number fields.
class Piece(BaseModed):
    game_id = db.ForeignKey(Game.id)
	master_id = db.ForeignKey(Piece_Master.id)
	player_id = db.ForeignKey(Player.id)
	x = db.IntegerField()
	y = db.IntegerField()
	rotation = db.IntegerField()
	flip = db.BooleanField()
