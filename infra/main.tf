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
