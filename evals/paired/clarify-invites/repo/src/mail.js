export async function sendMagicLink(email, url) {
  return { to: email, subject: "Sign in to Teamspace", url };
}
