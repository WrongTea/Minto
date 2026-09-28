# Minto: local startup and static CSS

Requires Python 3.12 or newer. From the project directory (PowerShell):

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py createsuperuser
.venv\Scripts\python manage.py check
.venv\Scripts\python manage.py collectstatic --noinput
.venv\Scripts\python manage.py runserver 127.0.0.1:8000
```

The current upstream settings use `DEBUG=True` for local development.
With `DEBUG=False`, WhiteNoise serves files collected into
`staticfiles/`; edit originals in `static/`, never the collected copies.
After changing CSS, stop your server, run `collectstatic --noinput` again,
restart it and refresh the browser without cache (Ctrl+F5).
For deployment, run collectstatic before starting/restarting your WSGI server.
`runserver` above is for local checks only.

```powershell
.venv\Scripts\python manage.py findstatic css/base.css css/404.css --verbosity 2
.venv\Scripts\python manage.py test
```

The custom `404.html` works with both `DEBUG=True` and `DEBUG=False`, with HTTP
status 404. In debug mode, `Debug404Middleware` replaces HTML 404 bodies while
preserving JSON responses and Django's diagnostic pages for server errors.
With debug disabled, Django's default 404 handler renders the template.
It uses local CSS and does not require Tailwind.
Ordinary pages retain their existing Tailwind CDN dependency in `base.html`;
their utility classes require access to `https://cdn.tailwindcss.com`.
WhiteNoise configuration follows the [official integration guide](https://whitenoise.readthedocs.io/en/stable/django.html).

## Admin styling

Open `/admin/` with a staff account. The override must be
`templates/admin/base_site.html` (including the `admin` directory).
It extends Django's admin layout and loads `static/css/admin_custom.css`;
the public site's `templates/base.html` is a separate layout.
The admin uses a fixed dark palette matching the student's original CSS.
After editing CSS with `DEBUG=False`, collect static files and restart the
server as shown above. Never edit files inside `.venv` or `staticfiles`.

See [the admin repair report](ADMIN_FIX_REPORT.md) for causes and verification.

## Earlier checkout verification (historical)

This is a separate diagnostic clone, `Minto-remote-review`, based on GitHub
`main` at `72061e7`. Fetch and pull --ff-only completed before changes.
The original local Minto directory with the reported settings.py/views.py
edits was not found. Those edits could not be compared or integrated;
this checkout must not be used to overwrite them wholesale.

Before the fix, a real isolated WSGI HTTP server returned HTML/404 for
`/static/css/base.css` and for the 404 template's relative CSS requests,
such as `/profile/5235/base.css`. `findstatic` located the source files,
but `collectstatic` failed because STATIC_ROOT was unset.

After the fix, using DEBUG=False, a fresh temporary SQLite database and an
automatically allocated loopback port:

- `/`: HTTP 200; base.css, copy_link.css and videos.css: HTTP 200, text/css.
- `/profile/5235/` and `/__minto_missing_91af6e__/`: custom template, HTTP 404;
  base.css and 404.css: HTTP 200, text/css, CSS bodies rather than error HTML.
- collectstatic: 160 files copied; all 8 tests and manage.py check passed.
- Tailwind CDN: HTTP 200, text/javascript, redirect to version 3.4.17.

No browser connection was available, so Network/Console, computed styles
and visual appearance were not verified. No user database or existing
server process was used. No commit or push was performed.
