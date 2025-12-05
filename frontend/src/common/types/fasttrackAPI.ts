export interface ConfigResponse {
  fusionUrl: string
  pusherKey: string
}

export interface LoginResponse {
  Data: {
    JwtToken: string
    Authentication: {
      IsAuthenticated: boolean
      AuthToken: string
    }
    User: {
      UserId: number
      BrandId: number
      IsTestUser: boolean
      Firstname: string
      Lastname: string
    }
  }
  Success: boolean
  Errors: Array<{
    Message: string
    Error: string
    ErrorCodeID: number
  }>
}
