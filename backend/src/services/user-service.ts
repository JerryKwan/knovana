import { randomUUID } from "node:crypto";
import { UserRepository } from "../storage/repositories/user-repo";
import { hashPassword, comparePassword } from "../auth/password";
import { generateToken } from "../auth/jwt";
import { BadRequestError, AuthError } from "../utils/errors";
import { User, UserSettings, DEFAULT_SETTINGS } from "../models/user";

export class UserService {
  private readonly userRepo = new UserRepository();

  /**
   * Registers a new user. Hashes password, saves user in SQLite, and generates token.
   */
  async register(
    username: string,
    plaintext: string,
  ): Promise<{ userId: string; token: string }> {
    if (!username || !plaintext) {
      throw new BadRequestError("Username and password are required");
    }

    const existingUser = this.userRepo.findByUsername(username);
    if (existingUser) {
      throw new BadRequestError("Username is already taken");
    }

    const userId = `usr_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const hashedPassword = await hashPassword(plaintext);
    const kbPath = userId; // Relative folder path for user's KB: e.g. knowledge-base/usr_abcd123

    const newUser = this.userRepo.create({
      id: userId,
      username,
      password_hash: hashedPassword,
      kb_path: kbPath,
      settings: JSON.stringify(DEFAULT_SETTINGS),
      status: "inactive",
    });

    const token = await generateToken(newUser.id, newUser.username);

    return {
      userId: newUser.id,
      token,
    };
  }

  /**
   * Logs in a user. Validates password and issues a JWT token.
   */
  async login(
    username: string,
    plaintext: string,
  ): Promise<{ userId: string; token: string }> {
    if (!username || !plaintext) {
      throw new BadRequestError("Username and password are required");
    }

    const user = this.userRepo.findByUsername(username);
    if (!user) {
      throw new AuthError("Invalid username or password");
    }

    const isValid = await comparePassword(plaintext, user.password_hash);
    if (!isValid) {
      throw new AuthError("Invalid username or password");
    }

    const token = await generateToken(user.id, user.username);

    return {
      userId: user.id,
      token,
    };
  }

  /**
   * Retrieves parsed user settings.
   */
  async getSettings(userId: string): Promise<UserSettings> {
    const user = this.userRepo.findById(userId);
    if (!user) {
      throw new AuthError("User not found");
    }

    try {
      const parsed = JSON.parse(user.settings);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (err) {
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Updates user settings.
   */
  async updateSettings(
    userId: string,
    updates: Partial<UserSettings>,
  ): Promise<void> {
    const current = await this.getSettings(userId);
    const finalSettings = { ...current, ...updates };
    this.userRepo.updateSettings(userId, finalSettings);
  }
}
