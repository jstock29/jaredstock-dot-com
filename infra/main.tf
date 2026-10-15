provider "google" {
  project = "driven-binder-500400-c2"
  region  = "us-central1"
}

provider "google-beta" {
  project = "driven-binder-500400-c2"
  region  = "us-central1"
}

resource "google_project_service" "firestore" {
  service = "firestore.googleapis.com"
}

resource "google_project_service" "identitytoolkit" {
  service = "identitytoolkit.googleapis.com"
}

resource "google_firestore_database" "default" {
  project     = "driven-binder-500400-c2"
  name        = "(default)"
  location_id = "us-central1"
  type        = "FIRESTORE_NATIVE"
  depends_on  = [google_project_service.firestore]
}

# REMOVED: google_firebase_project resource

resource "google_firebase_hosting_site" "default" {
  provider = google-beta
  project  = "driven-binder-500400-c2"
  site_id  = "jaredstock-dot-com"
}

resource "google_project_service" "firebaserules" {
  service = "firebaserules.googleapis.com"
}

# ─── Auth: email/password sign-in for the admin only ──────────
# Nobody can register an account from the site's public API key. The admin
# account is created once by hand (Firebase console -> Authentication).
#
# The project already has an auth config, so adopt it instead of creating one.
import {
  to = google_identity_platform_config.auth
  id = "projects/driven-binder-500400-c2/config"
}

resource "google_identity_platform_config" "auth" {
  project = "driven-binder-500400-c2"

  sign_in {
    allow_duplicate_emails = false
    email {
      enabled           = true
      password_required = true
    }
  }

  client {
    permissions {
      disabled_user_signup   = true
      disabled_user_deletion = true
    }
  }

  authorized_domains = [
    "localhost",
    "driven-binder-500400-c2.firebaseapp.com",
    "driven-binder-500400-c2.web.app",
    "jaredstock-dot-com.web.app",
    "jaredstock-dot-com.firebaseapp.com",
    "jaredstock.com",
    "www.jaredstock.com",
  ]

  depends_on = [google_project_service.identitytoolkit]
}

# ─── Firestore security rules ─────────────────────────────────
# Deployed from the same firestore.rules file the emulator tests use.
resource "google_firebaserules_ruleset" "firestore" {
  project = "driven-binder-500400-c2"
  source {
    files {
      name    = "firestore.rules"
      content = file("${path.module}/../firestore.rules")
    }
  }
  depends_on = [google_firestore_database.default, google_project_service.firebaserules]
}

resource "google_firebaserules_release" "firestore" {
  project      = "driven-binder-500400-c2"
  name         = "cloud.firestore"
  ruleset_name = google_firebaserules_ruleset.firestore.name

  lifecycle {
    replace_triggered_by = [google_firebaserules_ruleset.firestore]
  }
}
