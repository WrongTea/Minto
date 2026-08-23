from django.urls import path
from . import views


urlpatterns = [
    path("", views.videos, name="feed"),

    path(
        "video/<int:video_id>/like/",
        views.like_video,
        name="like_video"
    ),

    path(
        "video/<int:video_id>/comments/",
        views.video_comments,
        name="video_comments"
    ),

    path(
        "video/<int:video_id>/comments/add/",
        views.add_comment,
        name="add_comment"
    ),

    path(
        "video/<int:video_id>/view/",
        views.add_video_view,
        name="add_video_view"
    ),

    path(
        "profile/<str:username>/",
        views.profile,
        name="profile"
    ),

    path(
        "profile/<str:username>/follow/",
        views.follow_user,
        name="follow"
    ),

    path(
        "profile/<str:username>/unfollow/",
        views.unfollow_user,
        name="unfollow"
    ),

    path(
        "followed/",
        views.followed_creators_view,
        name="followed"
    ),

    path(
        "unfollow/<str:username>/",
        views.unfollow_from_followed,
        name="unfollow_from_followed"
    ),
    path(
        "search/",
        views.search,
        name="search"
    ),
    path(
        "video/<int:video_id>/",
        views.video_detail,
        name="video_detail"
    ),
    path(
        "account_status/", 
        views.account_status, 
        name="account_status"
    ),
    path(
        "support/", 
        views.support, 
        name="support"
    ),
    path(
        "report/", 
        views.report, 
        name="report"
    ),
    path(
        "create_video/",
        views.create_video,
        name="create_video"
    ),
    path(
    "video/<int:video_id>/delete/",
    views.delete_video,
    name="delete_video"
    ),
    path(
    "edit_profile/",
    views.edit_profile,
    name="edit_profile"
    ),
]