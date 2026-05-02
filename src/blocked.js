const params = new URLSearchParams(location.search);
const site = params.get("site") || "that site";
const session = params.get("session") || "Focus session";
document.querySelector("#blockedCopy").textContent = `${site} is blocked during ${session}.`;
