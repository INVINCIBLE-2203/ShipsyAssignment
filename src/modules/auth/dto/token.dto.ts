export interface JwtPayload {
    sub: string; // User ID
    email: string;
  }
  
  export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
  }
  