"""
ARCapture model — stores a screenshot taken during an AR session.

Each capture stores the image file plus the 3D transform (position, rotation,
scale) of the placed model at the moment of capture.  The product FK is
optional so captures can exist even if the product is later deleted.

No authentication is required — this is intentional for a capstone project.
Both the Next.js website and the iOS app consume the same GET API.
"""

from django.db import models
from django.utils import timezone


class ARCapture(models.Model):
    """A single AR screenshot captured by the user."""

    product = models.ForeignKey(
        'ar_service.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ar_captures',
        help_text='The product that was placed in AR when this capture was taken.',
    )
    image = models.ImageField(
        upload_to='ar_captures/',
        help_text='The captured AR screenshot image.',
    )

    # 3D position of the placed model at the moment of capture
    position_x = models.FloatField(default=0.0)
    position_y = models.FloatField(default=0.0)
    position_z = models.FloatField(default=0.0)

    # 3D rotation (Euler angles in radians) of the placed model
    rotation_x = models.FloatField(default=0.0)
    rotation_y = models.FloatField(default=0.0)
    rotation_z = models.FloatField(default=0.0)

    # Uniform scale factor of the placed model
    scale = models.FloatField(default=1.0)

    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'AR Capture'
        verbose_name_plural = 'AR Captures'

    def __str__(self):
        product_name = self.product.name if self.product else 'Unknown'
        return f'Capture #{self.pk} — {product_name} — {self.created_at:%Y-%m-%d %H:%M}'
