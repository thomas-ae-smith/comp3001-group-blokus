from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

class Game(models.Model):
	start_time = models.DateTimeField()
	game_type = models.IntegerField()

class PieceMaster(models.Model):
	piece_data = models.CharField(max_length=25)

class Player(models.Model):
	name = models.CharField(validators=[MinValueValidator(0), MaxValueValidator(30)])
	wins = models.IntegerField()
	losses = models.IntegerField()

class PositionColour(models.Model):
	colour = models.CharField()

class Piece(models.Model):
	game = models.ForeignKey(Game)
	master = models.ForeignKey(PieceMaster)
	player = models.ForeignKey(Player)
	x = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(20)])
	y = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(20)])
	rotation = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(3)])
	flip = models.BooleanField()

class PlayerGame(models.Model):
	game = models.ForeignKey(Game)
	index = models.ForeignKey(PositionColour)
	player = models.ForeignKey(Player)
