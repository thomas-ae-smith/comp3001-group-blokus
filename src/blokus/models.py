from django.core.validators import MaxValueValidator, MinValueValidator, MaxLengthValidator, MinLengthValidator, RegexValidator
from django.db import models

class Game(models.Model):
	start_time = models.DateTimeField()
	game_type = models.IntegerField()
	player_turn = models.PositiveIntegerField(validators=[MaxValueValidator(3)])

class PieceMaster(models.Model):
	piece_data = models.CharField(max_length=25)

class UserProfile(models.Model):
	name = models.CharField(max_length=30)

	wins = models.IntegerField()
	losses = models.IntegerField()

_colour_regex = r"^(red|yellow|green|blue)$"

class Player(models.Model):
	game = models.ForeignKey(Game)
	colour = models.CharField(max_length=6, validators=[RegexValidator(regex=_colour_regex)])
	user = models.ForeignKey(UserProfile)

class Piece(models.Model):
	game = models.ForeignKey(Game)
	master = models.ForeignKey(PieceMaster)
	player = models.ForeignKey(Player)

	x = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True)
	y = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True)

	rotation = models.PositiveIntegerField(validators=[MaxValueValidator(3)])
	flip = models.BooleanField()
