from django.db.models.signals import post_save
from django.contrib.auth.models import User

def _rotate_bitmap(bitmap, times):
	if (times % 4) > 0:
		rotated_bitmap = []
		for row in range(len(bitmap[0])):
			rotated_row = []
			for col in range(len(bitmap)):
				rotated_row.append(
					bitmap[len(bitmap) - 1 - col][row]
					)
			rotated_bitmap.append(tuple(rotated_row))
		return _rotate_bitmap(rotated_bitmap, times - 1)
	else:
		return tuple(bitmap)

def _transpose_bitmap(bitmap):
	transposed_bitmap = []
	for col in range(len(bitmap[0])):
		transposed_row = []
		for row in range(len(bitmap)):
			transposed_row.append(
				bitmap
					[row]
					[col]
				)
		transposed_bitmap.append(tuple(transposed_row))
	return tuple(transposed_bitmap)


def create_user_profile(sender, instance, created, **kwargs):
	if created:
		UserProfile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)
