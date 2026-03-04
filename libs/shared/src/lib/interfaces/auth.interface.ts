import { RoleCode } from '../enums/role.enum';

/** Payload encoded inside the JWT access token */
export interface ITokenPayload {
  sub: number; // user id
  email: string;
  role: RoleCode;
  iat?: number; // issued at (added by jwt.sign)
  exp?: number; // expiry (added by jwt.sign)
}

/** What is returned to the client after successful login */
export interface ITokenUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleCode;
  active: boolean;
}

/** Login request body */
export interface ILoginRequest {
  email: string;
  password: string;
}

/** Login/refresh response body (cookies are set separately) */
export interface ILoginResponse {
  user: ITokenUser;
}
