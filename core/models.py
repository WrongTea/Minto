from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator
from django.db import models

class User(AbstractUser):
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    description = models.CharField(max_length = 200, blank=True, default="")
    birth_date = models.DateField(blank=True, null=True)
    banned = models.BooleanField(default=False)
    ban_reason = models.CharField(max_length=255, blank=True)
    ban_until = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.username

class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Hashtag(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Video(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="videos")
    video_file = models.FileField(validators=[FileExtensionValidator(allowed_extensions=["mp4", "mov", "avi", "webm"])])
    preview = models.ImageField(upload_to="previews/", null=True, blank=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length = 200, blank=True, default="")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, related_name="videos", null=True, blank=True)
    hashtags = models.ManyToManyField(Hashtag, blank=True, related_name="videos")

    def __str__(self):
        return f"{self.author}: {self.video_file.name}"

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.follower} підписан на {self.following} в {self.created_at}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "following"],
                name="unique_follow"
            ),
            models.CheckConstraint(
                condition=~models.Q(follower=models.F("following")),
                name="no_self_follow"
            ),
        ]

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likes")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} лайкнув відео {self.video}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields =["user", "video"],
                name="unique_like"
            )
        ]

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="comments")
    text = models.CharField(max_length = 200) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} прокоментував відео {self.video} {self.created_at}"

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="favorites")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} додав відео в обране відео {self.video}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields =["user", "video"],
                name="unique_favorite"
            )
        ]

class View(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="views")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="views")
    viewed_at = models.DateTimeField(auto_now_add=True)
    watch_duration = models.DurationField(null=True, blank=True)

    def __str__(self):
        return f"{self.user} переглянул відео {self.video} протягом {self.watch_duration}"

class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ("video", "Video"),
        ("profile", "Profile"),
        ("comment", "Comment"),
    ]
    reporter = models.ForeignKey(User,on_delete=models.CASCADE,related_name="reports_sent")
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES, default="profile")
    reason = models.CharField(max_length=500)
    description = models.TextField()
    attachment = models.FileField(upload_to="reports/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_checked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.reporter.username} → {self.report_type}"

class SupportTicket(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="support_tickets" )
    subject = models.CharField(max_length=200)
    message = models.TextField()
    image = models.ImageField(upload_to="support/",blank=True,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)
    admin_reply = models.TextField(blank=True, null=True)
    replied_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.subject}"