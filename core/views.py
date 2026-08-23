from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db.models import Count, Q
from datetime import datetime

from .models import Video, User, Follow, Like, Comment, View, SupportTicket, Report, Hashtag, Category


# ============================================================
# VIDEOS
# ============================================================

def videos(request):
    videos = (
        Video.objects
        .all()
        .select_related("author", "category")
        .prefetch_related("hashtags", "likes", "comments")
        .annotate(views_count=Count("views"))
        .order_by("-upload_date")
    )

    liked_video_ids = set()

    if request.user.is_authenticated:
        liked_video_ids = set(
            Like.objects.filter(
                user=request.user,
                video__in=videos
            ).values_list("video_id", flat=True)
        )

    return render(request, "videos.html", {
        "videos": videos,
        "liked_video_ids": liked_video_ids,
    })


# ============================================================
# PROFILE
# ============================================================

def profile(request, username):
    profile_user = get_object_or_404(
        User,
        username=username
    )

    videos = (
        Video.objects
        .filter(author=profile_user)
        .select_related("author", "category")
        .prefetch_related("hashtags", "likes", "comments")
        .annotate(views_count=Count("views"))
        .order_by("-upload_date")
    )

    liked_video_ids = set()

    if request.user.is_authenticated:
        liked_video_ids = set(
            Like.objects.filter(
                user=request.user,
                video__in=videos
            ).values_list("video_id", flat=True)
        )

    is_following = False

    if request.user.is_authenticated:
        is_following = Follow.objects.filter(
            follower=request.user,
            following=profile_user
        ).exists()

    return render(
        request,
        "profile.html",
        {
            "profile_user": profile_user,
            "videos": videos,
            "liked_video_ids": liked_video_ids,
            "is_following": is_following,
        }
    )


# ============================================================
# ADD VIDEO VIEW
# ============================================================

@login_required
@require_POST
def add_video_view(request, video_id):
    video = get_object_or_404(Video, id=video_id)

    View.objects.create(
        user=request.user,
        video=video
    )

    views_count = View.objects.filter(
        video=video
    ).count()

    return JsonResponse({
        "success": True,
        "views_count": views_count,
    })
# ============================================================
# LIKE
# ============================================================

@login_required
@require_POST
def like_video(request, video_id):

    video = get_object_or_404(
        Video,
        id=video_id
    )

    like, created = Like.objects.get_or_create(
        user=request.user,
        video=video
    )

    if not created:
        like.delete()
        liked = False
    else:
        liked = True

    return JsonResponse({
        "liked": liked,
        "likes_count": video.likes.count(),
    })


# ============================================================
# COMMENTS
# ============================================================

@login_required
def video_comments(request, video_id):

    video = get_object_or_404(
        Video,
        id=video_id
    )

    comments = (
        video.comments
        .select_related("user")
        .order_by("created_at")
    )

    return JsonResponse({
        "comments": [
            {
                "id": comment.id,
                "username": comment.user.username,
                "avatar": (
                    comment.user.avatar.url
                    if comment.user.avatar
                    else ""
                ),
                "text": comment.text,
                "created_at": comment.created_at.strftime(
                    "%b %d, %Y %H:%M"
                ),
            }
            for comment in comments
        ]
    })


@login_required
@require_POST
def add_comment(request, video_id):

    video = get_object_or_404(
        Video,
        id=video_id
    )

    text = request.POST.get(
        "text",
        ""
    ).strip()

    if not text:
        return JsonResponse({
            "success": False,
            "error": "Comment cannot be empty."
        }, status=400)

    if len(text) > 200:
        return JsonResponse({
            "success": False,
            "error": "Comment is too long."
        }, status=400)

    comment = Comment.objects.create(
        user=request.user,
        video=video,
        text=text
    )

    return JsonResponse({
        "success": True,
        "comment": {
            "id": comment.id,
            "username": comment.user.username,
            "avatar": (
                comment.user.avatar.url
                if comment.user.avatar
                else ""
            ),
            "text": comment.text,
            "created_at": comment.created_at.strftime(
                "%b %d, %Y %H:%M"
            ),
        },
        "comments_count": video.comments.count(),
    })


# ============================================================
# FOLLOW
# ============================================================

@login_required
def follow_user(request, username):

    profile_user = get_object_or_404(
        User,
        username=username
    )

    if (
        request.method == "POST"
        and request.user != profile_user
    ):
        Follow.objects.get_or_create(
            follower=request.user,
            following=profile_user
        )

    return redirect(
        "profile",
        username=profile_user.username
    )


@login_required
def unfollow_user(request, username):

    profile_user = get_object_or_404(
        User,
        username=username
    )

    if request.method == "POST":
        Follow.objects.filter(
            follower=request.user,
            following=profile_user
        ).delete()

    return redirect(
        "profile",
        username=profile_user.username
    )


# ============================================================
# FOLLOWED
# ============================================================

@login_required
def followed_creators_view(request):

    followed_users = User.objects.filter(
        following__follower=request.user
    ).distinct()

    return render(
        request,
        "followed.html",
        {
            "followed_users": followed_users
        }
    )


@login_required
def unfollow_from_followed(request, username):

    profile_user = get_object_or_404(
        User,
        username=username
    )

    if request.method == "POST":
        Follow.objects.filter(
            follower=request.user,
            following=profile_user
        ).delete()

    return redirect("followed")

# ============================================================
# SEARCH
# ============================================================

from django.db.models import Q


def search(request):

    query = request.GET.get("q", "").strip()

    users = User.objects.none()
    videos = Video.objects.none()

    if query:

        # ----------------------------------------------------
        # USERS
        # ----------------------------------------------------

        users = (
            User.objects
            .filter(
                Q(username__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query)
            )
            .order_by("username")
            .distinct()[:20]
        )


        # ----------------------------------------------------
        # VIDEOS
        # ----------------------------------------------------

        videos = (
            Video.objects
            .filter(
                Q(author__username__icontains=query) |
                Q(author__first_name__icontains=query) |
                Q(author__last_name__icontains=query) |
                Q(description__icontains=query) |
                Q(hashtags__name__icontains=query)
            )
            .select_related("author")
            .prefetch_related("hashtags")
            .annotate(
                views_count=Count("views")
            )
            .distinct()
            .order_by("-upload_date")[:30]
        )


    # --------------------------------------------------------
    # PAGE
    # --------------------------------------------------------

    return render(
        request,
        "search.html",
        {
            "query": query,
            "users": users,
            "videos": videos,
            "active_page": "search",
        }
    )

# ============================================================
# VIDEO DETAIL
# ============================================================

def video_detail(request, video_id):

    video = get_object_or_404(
        Video.objects
        .select_related("author", "category")
        .prefetch_related("hashtags", "likes", "comments"),
        id=video_id
    )

    views_count = View.objects.filter(
        video=video
    ).count()

    liked = False

    if request.user.is_authenticated:
        liked = Like.objects.filter(
            user=request.user,
            video=video
        ).exists()

    return render(
        request,
        "video_detail.html",
        {
            "video": video,
            "views_count": views_count,
            "liked": liked,
        }
    )

def account_status(request):
    return render(request,  "account_status.html")

@login_required
def support(request):

    if request.method == "POST":
        subject = request.POST.get("subject", "").strip()
        message = request.POST.get("message", "").strip()
        image = request.FILES.get("image")

        if subject and message:
            SupportTicket.objects.create(
                user=request.user,
                subject=subject,
                message=message,
                image=image,
            )

            return render(request, "support.html", {
                "success": True,
                "tickets": SupportTicket.objects.filter(
                    user=request.user
                ).order_by("-created_at"),
            })

    tickets = SupportTicket.objects.filter(
        user=request.user
    ).order_by("-created_at")

    return render(request, "support.html", {
        "tickets": tickets,
    })

@login_required
def report(request):

    if request.method == "POST":

        Report.objects.create(
            reporter=request.user,
            report_type=request.POST.get("report_type"),
            reason=request.POST.get("reason"),
            description=request.POST.get("message"),
            attachment=request.FILES.get("attachment"),
        )

        return render(
            request,
            "report.html",
            {
                "report_sent": True
            }
        )

    return render(
        request,
        "report.html"
    )

@login_required
def create_video(request):

    if request.method == "POST":

        video_file = request.FILES.get("video_file")
        preview = request.FILES.get("preview")
        description = request.POST.get("description", "")
        category_id = request.POST.get("category")
        hashtags_text = request.POST.get("hashtags", "")

        video = Video.objects.create(
            author=request.user,
            video_file=video_file,
            preview=preview,
            description=description,
            category_id=category_id if category_id else None
        )

        hashtags = hashtags_text.split()

        for hashtag_name in hashtags:

            hashtag_name = hashtag_name.strip().lstrip("#")

            if hashtag_name:
                hashtag, created = Hashtag.objects.get_or_create(
                    name=hashtag_name
                )

                video.hashtags.add(hashtag)

        return redirect("/")

    categories = Category.objects.all()

    return render(
        request,
        "create_video.html",
        {
            "categories": categories,
        }
    )

# ============================================================
# DELETE VIDEO
# ============================================================

@login_required
@require_POST
def delete_video(request, video_id):

    video = get_object_or_404(
        Video,
        id=video_id
    )

    # Только автор может удалить своё видео
    if video.author != request.user:
        return JsonResponse({
            "success": False,
            "error": "You cannot delete this video."
        }, status=403)

    # Запоминаем файлы, чтобы удалить их физически
    video_file = video.video_file
    preview = video.preview

    video.delete()

    # Удаляем сам видеофайл
    if video_file:
        video_file.delete(save=False)

    # Удаляем превью, если оно есть
    if preview:
        preview.delete(save=False)

    return JsonResponse({
        "success": True
    })


@login_required
def edit_profile(request):
    user = request.user

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        description = request.POST.get("description", "").strip()
        birth_date = request.POST.get("birth_date", "").strip()
        avatar = request.FILES.get("avatar")

        if not username:
            return render(request, "edit_profile.html", {
                "error": "Username cannot be empty."
            })

        # Проверяем, занят ли username другим пользователем
        if User.objects.filter(
            username=username
        ).exclude(id=user.id).exists():
            return render(request, "edit_profile.html", {
                "error": "This username is already taken."
            })

        user.username = username
        user.description = description

        # =========================
        # BIRTH DATE
        # =========================
        if birth_date:
            try:
                # Преобразуем DD.MM.YYYY → YYYY-MM-DD
                user.birth_date = datetime.strptime(
                    birth_date,
                    "%d.%m.%Y"
                ).date()

            except ValueError:
                return render(request, "edit_profile.html", {
                    "error": "Invalid birth date. Use DD.MM.YYYY."
                })
        else:
            user.birth_date = None

        # =========================
        # AVATAR
        # =========================
        if avatar:
            user.avatar = avatar

        user.save()

        return redirect(
            "profile",
            username=user.username
        )

    return render(request, "edit_profile.html", {
        "profile_user": user
    })