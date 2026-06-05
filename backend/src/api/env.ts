import type { User } from "../models/user";

export interface AppEnv {
  Variables: {
    user: User;
  };
}
