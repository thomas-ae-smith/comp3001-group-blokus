from django.core.validators import MaxValueValidator, MinValueValidator, MaxLengthValidator, MinLengthValidator, RegexValidator
from django.db import models
from datetime import datetime, timedelta
from blokus.common import *
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
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
	number_of_moves = models.PositiveIntegerField(default=0)
	winning_colours = models.CharField(max_length=18, validators=[RegexValidator(regex=r"^((blue|yellow|red|green)(\|(blue|yellow|red|green))*)?$")])

	def get_grid(self, limit_to_player=None):
		grid = [[False]*20 for x in xrange(20)]
		if limit_to_player is None:
			players = self.player_set.all()
		else:
			players = [limit_to_player]
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

	# Returns the players with the highest score. Will only return multiple players if they share the same score.
	def get_winning_players(self):
		players = self.player_set.all()
		winners = []
		highscore = 0
		for player in players:
			if player.score > highscore:
				winner = [player]
				highscore = player.score
			elif player.score == highscore:
				winner.append(player)
		return winners

	def get_next_colour_turn(self):
		return {"blue":"yellow","yellow":"red","red":"green","green":"blue"}[self.colour_turn]

	def end_game(self):
		winners = self.get_winning_players()
		for winner in winners:
			winnerProfile = winner.user.get_profile()
			winnerProfile.wins += 1
			winnerProfile.save()
		self.winning_colours = "|".join([winner.colour] for winner in winners)
		for player in set(self.player_set.all()) - set(winners):
			profile = player.user.get_profile()
			profile.losses += 1
			profile.save()

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
				if (oldRecord.status != self.status) or (self.status == 'offline'):
					self.user.player_set.all().delete()
					self.user.get_profile().private_hash = None
				if self.status not in set(['private_2', 'private_4']):
					self.user.get_profile().private_hash = None
		except UserProfile.DoesNotExist:
			pass

		super(UserProfile, self).save(*args, **kwargs)



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
	score = models.IntegerField(default=0)

	def get_grid(self):
		return self.game.get_grid(limit_to_player = self)

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

	rotate = models.PositiveIntegerField(validators=[MaxValueValidator(3)], default=0)
	flip = models.BooleanField(default=False) #Represents a TRANSPOSITION; flipped pieces are flipped along the axis runing from top left to bottom right.

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
		#Construct grid of pieces of the same colour.
		grid = self.player.get_grid()

		#Compare piece being placed to pieces near it on the grid.
		for row_number, row_data in enumerate(self.get_bitmap()):
			for column_number, cell in enumerate(row_data):
				if cell:
					#If cell touches another cell of the same colour, invalid placement.
					for x_offset, y_offset in ((-1,0),(1,0),(0,1),(0,-1)):
						if grid[column_number + self.x + x_offset][row_number + self.y + y_offset]:
							return False

					#If cell is adjacent to cell of the same colour, allow placement.
					for x_offset, y_offset in ((1,1),(1,-1),(-1,1),(-1,-1)):
						if grid[column_number + self.x + x_offset][row_number + self.y + y_offset]:
							return True

		return False

	def is_valid_position(self):
		#logging.debug("Does not overlap:" + str(self.does_not_overlap()))
		#logging.debug("Is only adjancent:" + str(self.is_only_adjacent()))
		#logging.debug("Satisfies first move:" + str(self.satisfies_first_move()))
		#logging.debug("Is inside grid:" + str(self.is_inside_grid()))
		#logging.debug("Game is not over: " + str(self.player.game.winning_colours.strip()))
		return (self.does_not_overlap()
		and (self.is_only_adjacent() or self.satisfies_first_move())
		and self.is_inside_grid()
		and self.player.game.winning_colours.strip() == "") # Game is not over.

	def get_bitmap(self):	#Returns the bitmap of the master piece which has been appropriately flipped and rotated.
		bitmap = self.master.get_bitmap()	#Need to implement rotate and transpose.
		if self.flip:
			return transpose_bitmap(rotate_bitmap(bitmap, self.rotate))
		else:
			return rotate_bitmap(bitmap, self.rotate)

	def flip(self, horizontal):	#Flips the piece horizontally; horizontal is a bool where T flips horizontally and F flips vertically.
		self.rotate(not(bool(self.flip) ^ bool(horizontal)))
		self.flip = not self.flip

	def rotate(self, clockwise):	#Rotates the piece clockwise; 'clockwise' is a bool; T for clockwise rotation, F for anticlockwise.
		if (clockwise):
			self.rotate = (self.rotate + 1) % 4
		else:
			self.rotate = (self.rotate - 1) % 4

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
		return self.server_client_mapping[(self.rotate,self.flip)][1]

	def get_client_rotate(self):
		return self.server_client_mapping[(self.rotate,self.flip)][0]

	def get_server_flip(self, rotate, flip):
		client_server_mapping = dict((v,k) for k, v in self.server_client_mapping.iteritems())
		return client_server_mapping[(rotate,flip)][1]

	def get_server_rotate(self, rotate, flip):
		client_server_mapping = dict((v,k) for k, v in self.server_client_mapping.iteritems())
		return client_server_mapping[(rotate,flip)][0]

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
	instance.player.game.number_of_moves = instance.player.game.number_of_moves + 1
	instance.player.game.colour_turn = instance.player.game.get_next_colour_turn()
	instance.player.score += instance.master.get_point_value()
	if instance.player.game.is_game_over():
		instance.player.game.end_game()

	instance.player.game.save()
	instance.player.save()
	move.save()

# If a game is deleted, remove all hanging moves, pieces and players
# associated with the game.
@receiver(post_delete, sender=Game)
def cleanup_game(sender, instance, **kwargs):
	for player in instance.player_set.all():
		for piece in player.piece_set.all():
			piece.delete()
		userProfile = player.user.get_profile()
		userProfile.status = 'offline'
		userProfile.save()
		player.delete()
	for move in instance.move_set.all():
		move.delete()

'''
def facebook_extra_values(sender, user, response, details, **kwargs):
	user.get_profile().profile_image_url = "http://graph.facebook.com/%s/picture?type=square" % response.get('id')
	user.get_profile().save()
	return True
pre_update.connect(facebook_extra_values, sender=FacebookBackend)

def google_extra_values(sender, user, response, details, **kwargs):
#	user.get_profile().profile_image_url = "http://graph.google.com/%s/picture?type=square" % response.get('id')
	user.get_profile().save()
	return True
pre_update.connect(google_extra_values, sender=GoogleBackend)
'''

def social_extra_values(sender, user, response, details, **kwargs):
	result = False
	url = None
	if sender == FacebookBackend and "id" in response:
		url = "http://graph.facebook.com/%s/picture?type=square" % response.get('id')
	elif sender == google.GoogleOAuth2Backend and "picture" in response:
		url = response["picture"]
	else:
#		url = user.email
		url = "http://www.gravatar.com/avatar/%s?s=40&d=identicon" % md5_constructor(user.email.strip().lower())
	if url:
		user.get_profile().profile_image_url = url
		user.get_profile().save()
		result = True
	return True #result

pre_update.connect(social_extra_values, sender=None)