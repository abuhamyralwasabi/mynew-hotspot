# Deployment checklist

## HotSpot files

Upload the contents of `hotspot/` to the custom HTML directory used by the target HotSpot server. Keep `config.js`, `css/`, `js/`, and `imgs/` together.

MikroTik documents custom HotSpot pages as files on the router and uses the HotSpot profile HTML override directory for a custom page set.

## RouterOS 6 speed script

Open the User Profile used by the cards and paste `routeros/speed2.rsc` into **Scripts -> On Login**.

Before broad deployment, create one test account and verify:

1. A login request containing `domain=2M` results in the expected active-session domain.
2. `speed2` creates one Simple Queue for the client's IP.
3. The queue has the selected upload/download limits.
4. Status displays the same speed.
5. Changing the speed performs one logout and one re-login only.
6. A failed re-login shows the error and does not loop.
7. Normal logout never redirects back to login.

## Static config manager

Use `admin/config.html` on the management computer. The file is intentionally not a database.

Chrome/Edge may allow direct file open/save through the File System Access API. Other browsers can use the fallback file picker and download path.

Do not expose `admin/` as a public HotSpot page directory.

## Logo

The committed logo is `hotspot/imgs/NetPro-Logo.svg`.