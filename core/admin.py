from django.contrib import admin

from .models import (
    User,
    Category,
    Hashtag,
    Video,
    Follow,
    Like,
    Comment,
    Favorite,
    View,
    SupportTicket,
    Report
)


admin.site.register(User)
admin.site.register(Category)
admin.site.register(Hashtag)
admin.site.register(Video)
admin.site.register(Follow)
admin.site.register(Like)
admin.site.register(Comment)
admin.site.register(Favorite)
admin.site.register(View)
admin.site.register(Report)


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "subject",
        "is_resolved",
        "created_at",
        "replied_at",
    )

    list_filter = (
        "is_resolved",
        "created_at",
    )

    search_fields = (
        "user__username",
        "subject",
        "message",
    )

    readonly_fields = (
        "created_at",
        "replied_at",
    )

    ordering = (
        "is_resolved",
        "-created_at",
    )