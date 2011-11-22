from django.core.validators import MaxValueValidator, MinValueValidator, MaxLengthValidator, MinLengthValidator, RegexValidator
from django.db import models

class Game(models.Model):
	start_time = models.DateTimeField()
	game_type = models.IntegerField()
	player_turn = models.PositiveIntegerField(validators=[MaxValueValidator(3)])

	#def place_piece(self, piece):	#Places a piece and returns TRUE if the placement is valued, otherwise returns FALSE.

	def _validate_placement(self, piece):	#Returns TRUE if the placement is valid, FALSE otherwise.
		return (
			self._not_obstructed(piece) and
			self._adjacent_to_same_colour(piece)
		)

	def _not_obstructed(piece):	#Skeletal function
		return true

	def _adjacent_to_same_colour(piece):	#Skeletal function
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
			
		return tuple(tup)

class UserProfile(models.Model):
	name = models.CharField(max_length=30)

	wins = models.IntegerField()
	losses = models.IntegerField()

	#def __init__(self, name, password):
	#Currently accepts 'master' with any username so functions can be worked on before authentication is implemented.

_colour_regex = r"^(red|yellow|green|blue)$"

class Player(models.Model):
	game = models.ForeignKey(Game)
	colour = models.CharField(max_length=6, validators=[RegexValidator(regex=_colour_regex)])
	user = models.ForeignKey(UserProfile)

class Piece(models.Model):
	master = models.ForeignKey(PieceMaster)
	player = models.ForeignKey(Player)

	x = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True)
	y = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True)

	rotation = models.PositiveIntegerField(validators=[MaxValueValidator(3)])
	flip = models.BooleanField() #Represents a TRANSPOSITION; flipped pieces are flipped along the axis runing from top left to bottom right.

	def get_bitmap(self):	#Returns the bitmap of the master piece which has been appropriately flipped and rotated.
		return master.get_bitmap(rotation, flip)

	def flip(self, horizontal):	#Flips the piece horizontally; horizontal is a bool where T flips horizontally and F flips vertically.
		self.flip = not self.flip
		self.rotation = rotate(horizontal)

	def rotate(self, clockwise):	#Rotates the piece clockwise; 'clockwise' should be a bool; T for clockwise rotation, F for anticlockwise.
		if (clockwise):
			self.rotation = (self.rotation + 1) % 4
		else:
			self.rotation = (self.rotation - 1) % 4
