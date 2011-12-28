from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from blokus.models import UserProfile,Piece, Move
from datetime import datetime

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
	if created:
		UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)

@receiver(post_save, sender=Piece)
def record_move(sender, instance, **kwargs):
	# Construct and save the move.
	move = Move()
	move.piece = instance
	move.move_number = instance.player.game.number_of_moves + 1
	instance.player.game.number_of_moves = instance.player.game.number_of_moves + 1
	move.save()

	# Update the players 'last_active' field.
	instance.player.last_active = datetime.now()
	instance.player.save()

	# Why is this here?
	print kwargs
