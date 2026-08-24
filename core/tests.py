from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from .models import Video, View


User = get_user_model()


class VideoViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="viewer",
            password="password",
        )
        self.video = Video.objects.create(
            author=self.user,
            video_file="test-video.mp4",
        )
        self.view_url = reverse("add_video_view", args=[self.video.id])

    def test_authenticated_view_is_counted_and_returned(self):
        self.client.force_login(self.user)

        response = self.client.post(self.view_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["views_count"], 1)
        self.assertEqual(View.objects.filter(video=self.video).count(), 1)

    def test_guest_view_redirects_without_creating_a_record(self):
        response = self.client.post(self.view_url)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(View.objects.filter(video=self.video).count(), 0)


class ProfileTemplateTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner",
            password="password",
        )
        self.visitor = User.objects.create_user(
            username="visitor",
            password="password",
        )
        Video.objects.create(
            author=self.owner,
            video_file="test-video.mp4",
        )
        self.profile_url = reverse("profile", args=[self.owner.username])

    def test_owner_sees_create_video_card(self):
        self.client.force_login(self.owner)

        response = self.client.get(self.profile_url)

        self.assertContains(response, "Create new video")

    def test_visitor_does_not_see_create_video_card(self):
        self.client.force_login(self.visitor)

        response = self.client.get(self.profile_url)

        self.assertNotContains(response, "Create new video")

    def test_profile_uses_shared_copy_link_notification(self):
        self.client.force_login(self.owner)

        response = self.client.get(self.profile_url)

        self.assertContains(response, 'id="copy-link-notification"')
        self.assertContains(response, "css/copy_link.css")


class FeedTemplateTests(TestCase):
    def test_feed_video_starts_muted_for_allowed_autoplay(self):
        user = User.objects.create_user(
            username="author",
            password="password",
        )
        Video.objects.create(
            author=user,
            video_file="test-video.mp4",
        )

        response = self.client.get(reverse("feed"))

        self.assertContains(response, "muted")
        self.assertContains(response, "Unmute video")
