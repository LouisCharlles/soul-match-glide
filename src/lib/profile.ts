import type { AppProfile, ProfileFormValues } from "@/lib/types";

export const MIN_PROFILE_PHOTOS = 2;

export function sanitizePhotoList(photos: string[]) {
  return photos.map((photo) => photo.trim()).filter(Boolean);
}

export function sanitizeInterestList(interests: string[]) {
  return Array.from(new Set(interests.map((interest) => interest.trim()).filter(Boolean)));
}

export function isProfileComplete(profile: Pick<
  ProfileFormValues,
  "photos" | "occupation" | "education" | "city" | "state"
>) {
  const validPhotos = sanitizePhotoList(profile.photos);

  return (
    validPhotos.length >= MIN_PROFILE_PHOTOS &&
    profile.occupation.trim().length > 0 &&
    profile.education.trim().length > 0 &&
    profile.city.trim().length > 0 &&
    profile.state.trim().length > 0
  );
}

export function getProfileCompletionPercentage(profile: Pick<
  ProfileFormValues,
  "photos" | "occupation" | "education" | "city" | "state"
>) {
  let completedItems = 0;

  if (sanitizePhotoList(profile.photos).length >= MIN_PROFILE_PHOTOS) {
    completedItems += 1;
  }

  if (profile.occupation.trim()) {
    completedItems += 1;
  }

  if (profile.education.trim()) {
    completedItems += 1;
  }

  if (profile.city.trim()) {
    completedItems += 1;
  }

  if (profile.state.trim()) {
    completedItems += 1;
  }

  return Math.round((completedItems / 5) * 100);
}

export function profileToFormValues(profile: AppProfile): ProfileFormValues {
  return {
    name: profile.name,
    age: profile.age,
    bio: profile.bio === "Ainda sem bio." ? "" : profile.bio,
    occupation: profile.occupation === "Profissão não informada" ? "" : profile.occupation,
    education: profile.education === "Formação não informada" ? "" : profile.education,
    course: profile.course,
    city: profile.locationCity,
    state: profile.locationState,
    gender: profile.gender,
    sexualOrientation: profile.sexualOrientation,
    relationshipIntent: profile.relationshipIntent,
    interestIds: profile.interestItems.map((interest) => interest.id),
    photos: profile.photoItems.map((photo) => photo.url).filter((photo) => photo !== "/placeholder.svg"),
    showAge: profile.showAge,
    allowVideoCalls: profile.allowVideoCalls,
    allowDateSuggestions: profile.allowDateSuggestions,
    allowStudyMatch: profile.allowStudyMatch,
    invisibleMode: profile.invisibleMode,
  };
}

export function emptyProfileFormValues(): ProfileFormValues {
  return {
    name: "",
    age: 18,
    bio: "",
    occupation: "",
    education: "",
    course: "",
    city: "",
    state: "",
    gender: "other",
    sexualOrientation: "other",
    relationshipIntent: "exploring",
    interestIds: [],
    photos: ["", ""],
    showAge: true,
    allowVideoCalls: true,
    allowDateSuggestions: false,
    allowStudyMatch: true,
    invisibleMode: false,
  };
}
