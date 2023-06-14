export const validateDiscordUsername = async (username: string) => {
  // Check length requirement
  if (username.length < 2 || username.length > 32) {
    throw {
      message: "Invalid username length",
    };
  }

  // Check for invalid characters
  const allowedCharactersRegex = /^[a-z0-9_.]+$/;
  if (!allowedCharactersRegex.test(username)) {
    throw {
      message: "Only a to z, 0 to 9, underscore and periods are allowed",
    };
  }

  // Check for consecutive periods
  if (username.includes("..")) {
    throw {
      message: "Usernames are not allowed to have consecutive periods",
    };
  }

  return username;
};
