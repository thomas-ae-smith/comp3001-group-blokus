from django.core.validators import MaxValueValidator, MinValueValidator, MaxLengthValidator, MinLengthValidator, RegexValidator
from django.db import models
from datetime import datetime, timedelta
from blokus.common import *
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User
import hashlib

_colour_regex = r"^(blue|yellow|red|green)$"

class Game(models.Model):
	start_time = models.DateTimeField(default=datetime.now())
	game_type = models.IntegerField()
	colour_turn = models.CharField(max_length=6, validators=[RegexValidator(regex=_colour_regex)], default="blue")
	number_of_moves = models.PositiveIntegerField(default=0)
	uri = models.CharField(max_length=56)
	winner = models.IntegerField(default=-1)

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

	# Returns whether or not anybody can make any moves.
	def is_game_over(self):
		for player in self.player_set.all():
			if player.is_able_to_move():
				return False
		return True

	# Returns the player with the highest score.
	def get_winning_player(self):
		players = self.player_set.all()
		winner = players.pop()
		for player in players:
			if player.score > winner.score:
				winner = player
		return player

	def get_next_colour_turn(self):
		return {"blue":"yellow","yellow":"red","red":"green","green":"blue"}[self.colour_turn]

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

	def get_point_value(self):
		bitmap = self.get_bitmap()
		score = 0
		for y in xrange(len(bitmap)):
			for x in xrange(len(bitmap[0])):
				if bitmap[y][x]:
					score += 1
		return score

class UserProfile(models.Model):

	status_choices = (
		('offline','Offline'),
		('ingame','In game'),
		('looking_for_any','Looking for any game'),
		('looking_for_2','Looking for 2 player game'),
		('looking_for_4','Looking for 4 player game'),
		('private_2','In private lobby'),
		('private_4','In private lobby'),
	)

	private_queue = models.IntegerField(default=0)
	user = models.OneToOneField(User)
	status = models.CharField(max_length=255,choices=status_choices,default='offline')
	wins = models.IntegerField(default=0)
	losses = models.IntegerField(default=0)


# Colours MUST correspond to positions:
# Red - Top Left
# Green - Top Right
# Blue - Bottom Right
# Yellow - Bottom Left

class Player(models.Model):
	game = models.ForeignKey(Game)
	user = models.ForeignKey(User)
	colour = models.CharField(max_length=6, validators=[RegexValidator(regex=_colour_regex)])
	last_activity = models.DateTimeField(default=datetime.now())
	points = models.IntegerField(default=0)

	# Returns whether the player is able to make a move or not
	def is_able_to_move(self):
		grid = self.game.get_grid()
		unplaced_pieces = set(PieceMaster.objects.all()) - set([p.master for p in self.piece_set.all()])
		for x in xrange(20):
			for y in xrange(20):
				if not grid[y][x]:
					for master in unplaced_pieces:
						piece = Piece(master=master,player=self)
						for transposed in [False, True]:
							piece.transposed = transposed
							for rot in xrange(4):
								piece.rotation = rot
								for y_piece in xrange(len(piece.get_bitmap())):
									piece.y = y_piece
									for x_piece in xrange(len(piece.get_bitmap()[0])):
										piece.x = x_piece
										if piece.is_valid_position():
											return True
		return False


class Piece(models.Model):
	master = models.ForeignKey(PieceMaster)
	player = models.ForeignKey(Player)

	x = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True, default=0)
	y = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True, default=0)

	server_rotate = models.PositiveIntegerField(validators=[MaxValueValidator(3)], default=0)
	transposed = models.BooleanField(default=False) #Represents a TRANSPOSITION; flipped pieces are flipped along the axis runing from top left to bottom right.

	#Returns TRUE if the piece does not overlap with any other piece on the board.
	def does_not_overlap(self):
		grid = self.player.game.get_grid()
		piece_bitmap = self.get_bitmap()
		for row_number, row_data in enumerate(piece_bitmap):
			for column_number, cell in enumerate(row_data):
				if grid[self.x+column_number][self.y+row_number] and cell:
					return False
		return True

	def satisfies_first_move(self):
		if self.player.game.number_of_moves < 4:
			height = len(self.get_bitmap())
			width = len(self.get_bitmap()[0])
			if self.x == 0 and self.y == 0:
				return self.master.get_bitmap()[0][0]
			elif self.x + width == 19 and self.y == 0:
				return self.master.get_bitmap()[0][width]
			elif self.x + width == 0 and self.y == 19:
				return self.master.get_bitmap()[height][0]
			elif self.x + width == 19 and self.y == 19:
				return self.master.get_bitmap()[height][width]
		else:
			return False

	def is_inside_grid(self):
		height = len(self.get_bitmap())
		width = len(self.get_bitmap()[0])
		return (self.x >= 0 and self.y >= 0 and
			self.x + width < 20 and self.y + height < 20)

	# Returns TRUE if the piece is adjacent (touching the corner) of a
	# piece of the same colour, but does not actually touch another
	# piece of the same colour.
	def is_only_adjacent(self):
		this_bitmap = self.get_bitmap()

		#Construct grid of pieces of the same colour.
		grid = [[False]*20 for x in xrange(20)]
		for that_piece in self.player.piece_set.all():
			that_bitmap = that_piece.get_bitmap()
			for that_row in xrange(len(that_bitmap)):
				for that_col in xrange(len(that_bitmap[that_row])):
					grid[that_row+that_piece.y][that_col+that_piece.x] = that_bitmap[that_row][that_col]

		#Compare piece being placed to pieces near it on the grid.
		adjacent = False
		for this_row in xrange(len(this_bitmap)):
			for this_col in xrange(len(this_bitmap[this_row])):
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
							bool(grid[this_row + self.y - 1][this_col + self.x - 1])):
						adjacent = True

		return adjacent

	def is_valid_position(self):
		return (self.does_not_overlap() and
			(self.is_only_adjacent() or
			self.satisfies_first_move()) and
			self.is_inside_grid() and
			self.player.game.winner < 0) # Game is not over.

	def get_bitmap(self):	#Returns the bitmap of the master piece which has been appropriately flipped and rotated.
		bitmap = self.master.get_bitmap()	#Need to implement server_rotate and server_transpose.
		if self.transposed:
			return transpose_bitmap(rotate_bitmap(bitmap, self.server_rotate))
		else:
			return rotate_bitmap(bitmap, self.server_rotate)

	def flip(self, horizontal):	#Flips the piece horizontally; horizontal is a bool where T flips horizontally and F flips vertically.
		self.rotate(not(bool(self.transposed) ^ bool(horizontal)))
		self.transposed = not self.transposed

	def rotate(self, clockwise):	#Rotates the piece clockwise; 'clockwise' is a bool; T for clockwise rotation, F for anticlockwise.
		if (clockwise):
			self.rotation = (self.rotation + 1) % 4
		else:
			self.rotation = (self.rotation - 1) % 4

	# Mapping between the way the orientation is stored on the server (rot and
	# trans), and the way it is stored at the client (rot, v-flip and h-flip).
	# (<rot>, <trans>):(<rot>, <flip>)
	server_client_mapping = {
		(0,False):(0,0),
		(1,False):(1,0),
		(2,False):(2,0),
		(3,False):(3,0),
		(0,True):(3,1),
		(1,True):(2,1),
		(2,True):(1,1),
		(3,True):(0,1)
	}

	def get_client_flip(self):
		return self.server_client_mapping[(self.rotation,self.transposed)][1]

	def get_client_rotate(self):
		return self.server_client_mapping[(self.rotation,self.transposed)][0]

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
	instance.player.game.colour_turn = instance.player.game.get_next_colour_turn()
	instance.player.points += instance.master.get_point_value()
	if instance.player.game.is_game_over():
		instance.player.game.winner = instance.player.game.get_winning_player()

	instance.player.game.save()
	instance.player.save()
	move.save()
	print kwargs
