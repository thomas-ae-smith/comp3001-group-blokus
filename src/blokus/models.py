from django.core.validators import MaxValueValidator, MinValueValidator, MaxLengthValidator, MinLengthValidator, RegexValidator
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.db import models
from datetime import datetime


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


	def _validate_placement(self, piece):	#Returns TRUE if the placement is valid, FALSE otherwise.
		return (
			self._not_obstructed(piece) and
			self._adjacent_to_same_colour(piece)
		)

	def _not_obstructed(self, piece):	#Skeletal function
		return true

	def _adjacent_to_same_colour(self, piece):	#Skeletal function
		return true

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
		return tupl


class UserProfile(models.Model):
	user = models.OneToOneField(User)
	wins = models.IntegerField(default=0)
	losses = models.IntegerField(default=0)



_colour_regex = r"^(red|yellow|green|blue)$"

class Player(models.Model):

	status_choices = (
		('offline','Offline'),
		('ingame','In game'),
		('looking_for_any','Looking for any game'),
		('looking_for_2','Looking for 2 player game'),
		('looking_for_4','Looking for 4 player game'),
		('private','In private lobby'),
	)

	game = models.ForeignKey(Game,null=True)
	colour = models.CharField(max_length=6, validators=[RegexValidator(regex=_colour_regex)])
	user = models.ForeignKey(User)
	status = models.CharField(max_length=255,choices=status_choices)

class Piece(models.Model):
	master = models.ForeignKey(PieceMaster)
	player = models.ForeignKey(Player)

	x = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True, default=0)
	y = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True, default=0)

	rotation = models.PositiveIntegerField(validators=[MaxValueValidator(3)], default=0)
	flip = models.BooleanField(default=False) #Represents a TRANSPOSITION; flipped pieces are flipped along the axis runing from top left to bottom right.

	def is_valid_position(self):
		grid = self.player.game.get_grid()
		piece_bitmap = self.get_bitmap()
		for row_number, row_data in enumerate(piece_bitmap):
			for column_number, cell in enumerate(row_data):
				if grid[piece.x+column_number][piece.y+row_number]:
					return False
		return True

	def get_bitmap(self):	#Returns the bitmap of the master piece which has been appropriately flipped and rotated.
		bitmap = self.master.get_bitmap()	#Need to implement rotation and transposition.
		return bitmap

	def flip(self, horizontal):	#Flips the piece horizontally; horizontal is a bool where T flips horizontally and F flips vertically.
		self.flip = not self.flip
		self.rotation = rotate(horizontal)

	def rotate(self, clockwise):	#Rotates the piece clockwise; 'clockwise' is a bool; T for clockwise rotation, F for anticlockwise.
		if (clockwise):
			self.rotation = (self.rotation + 1) % 4
		else:
			self.rotation = (self.rotation - 1) % 4

def transpose_bitmap(bitmap):
	transposed_bitmap = []

	for row in range(0, len(bitmap)):
		transposed_row = []
		for col in range(0, len(bitmap[0])):
			transposed_row.append(bitmap[col][row])
		transposed_bitmap.append(tuple(transposed_row))

	return transposed_bitmap

def create_user_profile(sender, instance, created, **kwargs):
	if created:
		UserProfile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)
