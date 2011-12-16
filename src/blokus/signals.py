from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User, UserProfile
from blokus.models import Piece, Move

def create_user_profile(sender, instance, created, **kwargs):
	if created:
		UserProfile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)

@receiver(pre_save, sender=Piece)
def record_move(sender, **kwargs):
	move = Move()
	move.piece = sender
	move.move_number = sender.player.game.number_of_moves + 1
	sender.player.game.number_of_moves = sender.player.game.number_of_moves + 1
	move.save()
