from django.db import models
#from google.appengine.ext import db

class Game(models.Model):
	start_time = models.DateTimeField()
	type = models.IntegerField()

class Piece_Master(models.Model):
	piece_data = models.CharField(max_length=255)

class Player(models.Model):
	name = models.CharField(max_length=50)
	wins = models.IntegerField()
	losses = models.IntegerField()

class Position_Colour(models.Model):
	colour = models.IntegerField()

#TODO: set limits on the number fields.
class Piece(models.Model):
	game_id = models.ForeignKey(Game)
	master_id = models.ForeignKey(Piece_Master)
	player_id = models.ForeignKey(Player)
	x = models.IntegerField()
	y = models.IntegerField()
	rotation = models.IntegerField()
	flip = models.BooleanField()

class Player_Game(models.Model):
	game_id = models.ForeignKey(Game)
	position = models.ForeignKey(Position_Colour)
	player_id = models.ForeignKey(Player)

