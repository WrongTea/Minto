from django.contrib import admin
from .models import (User, Category, Hashtag, Video, Follow, Like, Comment, Favorite, View, SupportTicket, Report)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "is_staff", "banned","ban_reason", "ban_until")
    search_fields = ("username", "email")
    list_filter = ("banned", "is_staff", "is_superuser")
    ordering = ("-date_joined",)
    list_editable = ("banned",)

    actions = ["unban_users"]

    @admin.action(description="Unban selected users")
    def unban_users(self, request, queryset):
        count = queryset.update(banned=False)
        self.message_user(request, f"Unban uses: {count}")

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)

@admin.register(Hashtag)
class HashtagAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)

@admin.register(Comment)
class CommenttagAdmin(admin.ModelAdmin):
    list_display = ("user", "video", "text", "created_at")
    search_fields = ("text", "user__username")
    list_filter = ("created_at",)
    ordering = ("-created_at",)

@admin.register(Favorite)
class FavoritetagAdmin(admin.ModelAdmin):
    list_display = ("user", "video", "created_at")
    search_fields = ("user__username", "video__description")
    list_filter = ("created_at",)

@admin.register(View)
class ViewAdmin(admin.ModelAdmin):
    list_display = ("user", "video", "watch_duration", "viewed_at")
    search_fields = ("user__username",)
    list_filter = ("viewed_at",)
    ordering = ("-viewed_at",)

@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("author", "video_file", "preview", "description","category",)
    search_fields = ("author", "category",)
    list_filter = ("author", "category", )
    ordering = ("-upload_date",)

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("follower", "following", "created_at")
    search_fields = ("follower__username", "following__username")

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("user", "video", "created_at")
    search_fields = ("user__username",)

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("reporter", "report_type", "reason", "description", "attachment", "created_at", "is_checked")
    list_filter = ("report_type", "is_checked", "created_at")
    search_fields = ("reporter__username", "reason", "description")
    ordering = ("-created_at",)

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "subject", "is_resolved", "created_at", "replied_at",)
    list_filter = ("is_resolved", "created_at",)
    search_fields = ("user__username", "subject", "message",)
    readonly_fields = ("created_at", "replied_at",)
    ordering = ("is_resolved", "-created_at",)

admin.site.site_header = "Minto Control Panel"
admin.site.site_title = "Minto Admin"
admin.site.index_title = "Video Platform Management"