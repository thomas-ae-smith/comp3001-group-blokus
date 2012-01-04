from django.core.validators import MaxValueValidator, MinValueValidator, MaxLengthValidator, MinLengthValidator, RegexValidator
from django.db import models
from datetime import datetime
from blokus.common import *
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User

class Game(models.Model):
	start_time = models.DateTimeField(default=datetime.now())
	game_type = models.IntegerField()
	player_turn = models.PositiveIntegerField(validators=[MaxValueValidator(3)], default=0)
	number_of_moves = models.PositiveIntegerField(default=0)

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
	piece_data = models.CharField(max_length=12)	#Represented by '1', '0' and ','; '1' represents a block, '0' represents no block, ',' represents newline.

	def get_bitmap(self):
		tup = []
		for row in self.piece_data.split(','):
			rowlist = []
			for number in row:
				rowlist.append(bool(int(number)))
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
	status = models.CharField(max_length=255,choices=status_choices,default='offline')
	wins = models.IntegerField(default=0)
	losses = models.IntegerField(default=0)


# Colours MUST correspond to positions:
# Red - Top Left
# Green - Top Right
# Blue - Bottom Right
# Yellow - Bottom Left
_colour_regex = r"^(red|yellow|green|blue)$"

class Player(models.Model):
	game = models.ForeignKey(Game)
	user = models.ForeignKey(User)
	colour = models.CharField(max_length=6, validators=[RegexValidator(regex=_colour_regex)])
	last_activity = models.DateTimeField(default=datetime.now())

class Piece(models.Model):
	master = models.ForeignKey(PieceMaster)
	player = models.ForeignKey(Player)

	x = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True, default=0)
	y = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True, default=0)

	rotation = models.PositiveIntegerField(validators=[MaxValueValidator(3)], default=0)
	transposed = models.BooleanField(default=False) #Represents a TRANSPOSITION; flipped pieces are flipped along the axis runing from top left to bottom right.

	def is_valid_position(self):
		return (does_not_overlap() and
			(is_only_adjacent() or
			satisfies_first_move()) and
			is_inside_grid())

	#Returns TRUE if the piece does not overlap with any other piece on the board.
	def does_not_overlap(self):
		grid = self.player.game.get_grid()
		piece_bitmap = self.get_bitmap()
		for row_number, row_data in enumerate(piece_bitmap):
			for column_number, cell in enumerate(row_data):
				if grid[piece.x+column_number][piece.y+row_number] and cell:
					return False
		return True

	def satisfies_first_move(self):
		height = len(self.get_bitmap)
		width = len(self.get_bitmap[0])
		if self.player.colour == 'red' and self.player.game.player_turn == 0:
			return self.master.get_bitmap()[0][0]
		elif self.player.colour == 'green' and self.player.game.player_turn == 1:
			return self.master.get_bitmap()[0][width]
		elif self.player.colour == 'yellow' and self.player.game.player_turn == 2:
			return self.master.get_bitmap()[height][0]
		elif self.plaer.colour == 'blue' and self.player.game.player_turn == 3:
			return self.master.get_bitmap()[height][width]

	def is_inside_grid(self):
		height = len(self.get_bitmap)
		width = len(self.get_bitmap[0])
		return (self.x >= 0 and self.y >= 0 and
			self.x + width < 20 and self.y + height < 20)

	# Returns TRUE if the piece is adjacent (touching the corner) of a
	# piece of the same colour, but does not actually touch another
	# piece of the same colour.
	def is_only_adjacent(self):
		this_bitmap = self.get_bitmap()

		#Construct grid of pieces of the same colour.
		grid = [[False]*20 for x in xrange(20)]
		for that_piece in player.piece_set.all():
			that_bitmap = that_piece.get_bitmap()
			for that_row in that_bitmap:
				for that_col in that_bitmap[that_row]:
					grid[that_row+that_piece.y][that_col+that_piece.x] = that_bitmap[that_row][that_col]

		#Compare piece being placed to pieces near it on the grid.
		adjacent = False
		for this_row in this_bitmap:
			for this_col in this_bitmap[this_row]:
				if bool(this_bitmap[this_row][this_col]):
					#If cell touches another cell of the same colour, invalid placement.
					if (bool(grid[this_row + self.y - 1][this_col + self.x]) or
							bool(grid[this_row + self.y + 1][this_col + self.x]) or
							bool(grid[this_row + self.y][this_col + self.x + 1]) or
							bool(grid[this_row + self.y][this_col + self.x - 1])):
						return False
					#If cell is adjacent to cell of the same colour, allow placement.
					if (bool(grid[this_row + self.y + 1][this_col + self.x + 1]) or
							bool(grid[this_row + self.y + 1][this_col + self.x - 1]) or
							bool(grid[this_row + self.y - 1][this_col + self.x + 1]) or
							bool(grid[this_row + self.y] - 1[this_col + self.x - 1])):
						adjacent = True

		return adjacent

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

class Move(models.Model):
	piece = models.ForeignKey(Piece)
	move_number = models.PositiveIntegerField()


############
# SIGNALS  #
############


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
	from blokus.models import UserProfile
	if created:
		UserProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=Piece)
def record_move(sender, instance, **kwargs):
	move = Move()
	move.piece = instance
	move.move_number = instance.player.game.number_of_moves + 1
	instance.player.game.number_of_moves = instance.player.game.number_of_moves + 1
	instance.player.game.player_turn = instance.player.game.number_of_moves % 4
	move.save()
	print kwargs
