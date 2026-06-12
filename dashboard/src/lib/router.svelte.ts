class Router {
  currentPath = $state(typeof window !== "undefined" ? window.location.pathname : "/dashboard/");

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", this.handlePopState);
    }
  }

  private handlePopState = () => {
    this.currentPath = window.location.pathname;
  };

  /**
   * Navigate to a path using HTML5 History API
   */
  navigate(path: string) {
    if (typeof window !== "undefined") {
      if (window.location.pathname !== path) {
        window.history.pushState({}, "", path);
        this.currentPath = path;
      }
    }
  }

  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("popstate", this.handlePopState);
    }
  }
}

export const router = new Router();
