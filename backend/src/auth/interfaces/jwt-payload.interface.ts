// Keep the signed token payload limited to the account ID; reload profile/roles from storage.
export interface JwtPayload {
  sub: string;
}
