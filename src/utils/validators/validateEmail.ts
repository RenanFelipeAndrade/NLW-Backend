export function validateEmail(email: string) {
  if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    throw { message: "Insert a valid email address" };
  }
  return email;
}
