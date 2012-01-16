from django.core.validators import MaxValueValidator, MinValueValidator, MaxLengthValidator, MinLengthValidator, RegexValidator
from django.db import models
from datetime import datetime, timedelta
from blokus.common import *
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.forms import ValidationError
import hashlib
import logging

from social_auth.signals import pre_update
from social_auth.backends.facebook import FacebookBackend
from social_auth.backends import google

from django.utils.hashcompat import md5_constructor

_colour_regex = r"^(blue|yellow|red|green)$"

class Game(models.Model):
	start_time = models.DateTimeField(default=datetime.now())
	game_type = models.IntegerField()
	colour_turn = models.CharField(max_length=6, validators=[RegexValidator(regex=_colour_regex)], default="blue")
	turn_start = models.DateTimeField(default=datetime.now())
	number_of_moves = models.PositiveIntegerField(default=0)
	game_over = models.BooleanField(default=False)
	last_move_time = models.DateTimeField(default=datetime.now())
	continuous_skips = models.PositiveIntegerField(default=0)

	def get_grid(self, limit_to_player=None):
		grid = [[False]*20 for x in xrange(20)]
		if limit_to_player is None:
			players = self.player_set.all()
		else:
			players = [limit_to_player]
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
		if self.continuous_skips >= 4:
			return True

	# Returns the players with the highest score. Will only return multiple players if they share the same score.
	def get_winning_players(self):
		players = self.player_set.all()
		winners = []
		highscore = 0
		for player in players:
			if player.score > highscore:
				winners = [player]
				highscore = player.score
			elif player.score == highscore:
				winners.append(player)
		return winners

	def get_next_colour_turn(self):
		return {"blue":"yellow","yellow":"red","red":"green","green":"blue"}[self.colour_turn]

	def end_game(self):
		winners = self.get_winning_players()
		for winner in winners:
			winnerProfile = winner.user.get_profile()
			winnerProfile.wins += 1
			winnerProfile.save()
		for player in set(self.player_set.all()) - set(winners):
			profile = player.user.get_profile()
			profile.losses += 1
			profile.save()
		self.game_over = True;
		self.save()

	def turn_complete(self):
		if self.is_game_over():
			self.end_game()
		self.last_move_time = datetime.now()
		self.save()

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

	private_hash = models.CharField(max_length=255,null=True)
	user = models.OneToOneField(User)
	status = models.CharField(max_length=255,choices=status_choices,default='offline')
	wins = models.IntegerField(default=0)
	losses = models.IntegerField(default=0)
	profile_image_url = models.CharField(max_length=255,default='/static/img/noavatar.jpg')
	is_guest = models.BooleanField(default=False)

	def save(self, *args, **kwargs):
		try:
			if self.id is not None:
				oldRecord = UserProfile.objects.get(id=self.id)
				if self.status == 'private' and self.private_hash is not None:
					other_player_profiles = UserProfile.objects.filter(private_hash=self.private_hash).exclude(id=self.id)
					self.status = other_player_profiles[0].status
					logging.error(self.status)
				elif (oldRecord.status != self.status) or (self.status == 'offline'):
					try:
						game = self.user.player_set.all()[0].game
						game.number_of_moves += 1
						game.save()
					except IndexError:
						pass
					self.user.player_set.all().delete()
					self.private_hash = None
				elif self.status not in set(['private_2', 'private_4']):
					self.private_hash = None
		except UserProfile.DoesNotExist:
			pass
		super(UserProfile, self).save(*args, **kwargs)

class Player(models.Model):
	game = models.ForeignKey(Game)
	user = models.ForeignKey(User)
	colour = models.CharField(max_length=6, validators=[RegexValidator(regex=_colour_regex)])
	last_activity = models.DateTimeField(default=datetime.now())
	score = models.IntegerField(default=0)
	can_move = models.BooleanField(default=True)

	def get_grid(self):
		return self.game.get_grid(limit_to_player = self)

class Piece(models.Model):
	master = models.ForeignKey(PieceMaster)
	player = models.ForeignKey(Player)

	x = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True, default=0)
	y = models.PositiveIntegerField(validators=[MaxValueValidator(20)],null=True, default=0)

	rotation = models.PositiveIntegerField(validators=[MaxValueValidator(3)], default=0)
	flip = models.BooleanField(default=False) #Represents a TRANSPOSITION; flipped pieces are flipped along the axis runing from top left to bottom right.

	#Returns TRUE if the piece does not overlap with any other piece on the board.
	def does_not_overlap(self, bitmap, grid):
		for rowNumber, rowData in enumerate(bitmap):
			for columnNumber, cell in enumerate(rowData):
				if grid[self.x+columnNumber][self.y+rowNumber] and cell:
					return False
		return True

	# Return TRUE if placing the piece would result in a square being placed in a corner of the board, otherwise false.
	def placed_in_corner(self, bitmap):
		height = len(bitmap) - 1
		width = len(bitmap[0]) - 1
		if self.x == 0 and self.y == 0:
			return bitmap[0][0]
		elif self.x + width == 19 and self.y == 0:
			return bitmap[0][width]
		elif self.x == 0 and self.y + height == 19:
			return bitmap[height][0]
		elif self.x + width == 19 and self.y + height == 19:
			return bitmap[height][width]

	def is_inside_grid(self, bitmap):
		height = len(bitmap) - 1
		width = len(bitmap[0]) - 1
		return (self.x >= 0 and self.y >= 0 and
			self.x + width < 20 and self.y + height < 20)

	# Returns TRUE if the piece shares a vertex but not a flat side with a piece of own colour
	def is_only_adjacent(self, bitmap, grid):
		#Compare piece being placed to pieces near it on the grid.
		for row_number, row_data in enumerate(self.get_bitmap()):
			for column_number, cell in enumerate(row_data):
				if cell:
					#If cell touches another cell of the same colour on a flat side, invalid placement.
					for x_offset, y_offset in ((-1,0),(1,0),(0,1),(0,-1)):
						try:
							if grid[column_number + self.x + x_offset][row_number + self.y + y_offset]:
								return False
						except IndexError:
							pass

					#If cell is shares a vertex of a cell of the same colour, allow placement.
					for x_offset, y_offset in ((1,1),(1,-1),(-1,1),(-1,-1)):
						try:
							if grid[column_number + self.x + x_offset][row_number + self.y + y_offset]:
								return True
						except IndexError:
							pass

		return False

	def has_this_piece(self):
		if self.master in (set(PieceMaster.objects.all()) - set([p.master for p in self.player.piece_set.all()])):
			return True
		return False

	def is_valid_position(self, grid_all, grid_player):
		bitmap = self.get_bitmap()
		return (
			self.is_inside_grid(bitmap) and
			self.has_this_piece() and
			self.does_not_overlap(bitmap, grid_all) and
			(self.is_only_adjacent(bitmap, grid_player) or
			self.placed_in_corner(bitmap))
			)

	def get_bitmap(self):	#Returns the bitmap of the master piece which has been appropriately flipped and rotated.
		bitmap = self.master.get_bitmap()	#Need to implement rotate and transpose.
		if self.flip:
			return transpose_bitmap(rotate_bitmap(bitmap, self.rotation))
		else:
			return rotate_bitmap(bitmap, self.rotation)

	# Only saves if the positioning validates. Otherwise throw error.
	def save(self, *args, **kwargs):
		self.player.last_activity = datetime.now()
		self.player.save()
		if(len(User.objects.filter(username="test_user")) > 0):
			super(Piece, self).save(*args, **kwargs)
		else:
			if not self.is_valid_position(self.player.get_grid(), self.player.game.get_grid()):
				raise ValidationError("That is not a valid position for a piece!")
		super(Piece, self).save(*args, **kwargs)


class Move(models.Model):
	piece = models.ForeignKey(Piece)
	game = models.ForeignKey(Game)
	move_number = models.PositiveIntegerField()


############
# SIGNALS  #
############

# If a Player object is created for a user with existing Player objects,
# and the new object is attached to a different game to the old object(s),
# delete the old Player object.
@receiver(pre_save, sender=Player)
def delete_players_on_new_game(sender, instance, **kwargs):
	oldPlayers = Player.objects.filter(user=instance.user)
	if len(oldPlayers) > 0 and instance.game_id != oldPlayers[0].game.id:
		for player in oldPlayers:
			player.delete()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
	from blokus.models import UserProfile
	if created:
		UserProfile.objects.get_or_create(user_id=instance.id)

@receiver(post_save, sender=Piece)
def record_move(sender, instance, **kwargs):
	move = Move()
	move.piece = instance
	move.game = instance.player.game
	move.move_number = instance.player.game.number_of_moves + 1

	instance.player.game.continuous_skips = 0
	instance.player.game.number_of_moves = instance.player.game.number_of_moves + 1
	instance.player.game.colour_turn = instance.player.game.get_next_colour_turn()
	instance.player.game.turn_start = datetime.now()
	instance.player.score += instance.master.get_point_value()
	instance.player.save()
	
	move.save()
	instance.player.game.turn_complete()

# If a game is deleted, remove all hanging moves, pieces and players
# associated with the game.
@receiver(post_delete, sender=Game)
def cleanup_game(sender, instance, **kwargs):
	for player in instance.player_set.all():
		player.piece_set.all().delete()
		userProfile = player.user.get_profile()
		userProfile.status = 'offline'
		userProfile.save()
		player.delete()
	instance.move_set.all().delete()

def social_extra_values(sender, user, response, details, **kwargs):
	result = False
	url = None
	if sender == FacebookBackend and "id" in response:
		url = "http://graph.facebook.com/%s/picture?type=square" % response.get('id')
	else:
		url = "http://www.gravatar.com/avatar/%s?s=40&d=identicon" % md5_constructor(user.email.strip().lower())
	if url:
		user.get_profile().profile_image_url = url
		user.get_profile().save()
		result = True
	return True #result

pre_update.connect(social_extra_values, sender=None)
