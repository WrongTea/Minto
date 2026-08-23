from django.shortcuts import redirect
from django.utils import timezone


class BannedUserMiddleware:

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        if request.user.is_authenticated:

            # Admin can access the admin panel
            if request.path.startswith("/admin/") and request.user.is_staff:
                return self.get_response(request)

            # Check ban
            if request.user.banned:

                # Temporary ban has expired
                if (
                    request.user.ban_until
                    and request.user.ban_until <= timezone.now()
                ):
                    request.user.banned = False
                    request.user.ban_until = None

                    request.user.save(
                        update_fields=[
                            "banned",
                            "ban_until",
                        ]
                    )

                else:

                    allowed_paths = [
                        "/account_status/",
                        "/support/",
                    ]

                    if (
                        request.path not in allowed_paths
                        and not request.path.startswith("/media/")
                    ):
                        return redirect("account_status")

        return self.get_response(request)