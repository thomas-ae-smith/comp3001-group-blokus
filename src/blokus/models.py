from django.core.validators import MaxValueValidator, MinValueValidator, MaxLengthValidator, MinLengthValidator, RegexValidator
from django.db import models
from datetime import datetime
from blokus.common import *

class Game(models.Model):
	start_time = models.DateTimeField(default=datetime.now())
	game_type = models.IntegerField()
	player_turn = models.PositiveIntegerField(validators=[MaxValueValidator(3)], default=0)

	def get_grid(self):
		grid = [[False]*20 for x in xrange(20)]
		players = self.player_set.all()
		for player in players:
			pieces = player.piece_set.all()
			for piece in pieces:
				piece_bitmap = piece.get_bitmap()
				for row_number, row_data in enumerate(piece_bitmap):
					for column_number, cell in enumerate(row_data):
						grid[piece.x+column_number][piece.y+row_number] = cell
		return grid


class PieceMaster(models.Model):
	piece_data = models.CharField(max_length=12)	#Repretented by 'T', 'F' and ','; 'T' represents a block, 'F' represents no block, ',' represents newline.

	def get_bitmap(self):
		tup = []
		for row in self.piece_data.split(','):
			rowlist = []
			for letter in row:
				if letter == 'T':
					rowlist.append(True)
				elif letter == 'F':
					rowlist.append(False)
			tup.append(tuple(rowlist))
		return tuple(tup)

class UserProfile(models.Model):

	status_choices = (
		('offline','Offline'),
		('ingame','In game'),
		('looking_for_any','Looking for any game'),
		('looking_for_2','Looking for 2 player game'),
		('looking_for_4','Looking for 4 player game'),
		('private','In private lobby'),
	)


	user = models.OneToOneField(User)
	status = models.CharField(max_length=255,choices=status_choices)
	wins = models.IntegerField()
	losses = models.IntegerField()



_colour_regex = r"^(red|yellow|green|blue)$"

class Player(models.Model):
	game = models.ForeignKey(Game)
	colour = models.CharField(max_length=6, validators=[RegexValidator(regex=_colour_regex)])
	user = models.ForeignKey(User)

class Piece(models.Model):
	master = models.ForeignKey(PieceMaster)
	player = models.ForeignKey(Player)

	x = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True, default=0)
	y = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True, default=0)

	rotation = models.PositiveIntegerField(validators=[MaxValueValidator(3)], default=0)
	transposed = models.BooleanField(default=False) #Represents a TRANSPOSITION; flipped pieces are flipped along the axis runing from top left to bottom right.

	def is_valid_position(self):
		grid = self.player.game.get_grid()
		piece_bitmap = self.get_bitmap()
		for row_number, row_data in enumerate(piece_bitmap):
			for column_number, cell in enumerate(row_data):
				if grid[piece.x+column_number][piece.y+row_number] and cell:
					return False
		return True

	def get_bitmap(self):	#Returns the bitmap of the master piece which has been appropriately flipped and rotated.
		bitmap = self.master.get_bitmap()	#Need to implement rotation and transposition.
		if self.transposed:
			return transpose_bitmap(rotate_bitmap(bitmap, self.rotation))
		else:
			return rotate_bitmap(bitmap, self.rotation)

	def flip(self, horizontal):	#Flips the piece horizontally; horizontal is a bool where T flips horizontally and F flips vertically.
		self.rotate(not(bool(self.transposed) ^ bool(horizontal)))
		self.transposed = not self.transposed

	def rotate(self, clockwise):	#Rotates the piece clockwise; 'clockwise' is a bool; T for clockwise rotation, F for anticlockwise.
		if (clockwise):
			self.rotation = (self.rotation + 1) % 4
		else:
			self.rotation = (self.rotation - 1) % 4
