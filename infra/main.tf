provider "google" {
  project = "driven-binder-500400-c2"
  region  = "us-central1"
}

provider "google-beta" {
  project = "driven-binder-500400-c2"
  region  = "us-central1"
}

# REMOVED: google_firebase_project resource

resource "google_firebase_hosting_site" "default" {
  provider = google-beta
  project  = "driven-binder-500400-c2"
  site_id  = "jaredstock-dot-com"
}
