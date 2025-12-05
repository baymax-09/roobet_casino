declare module 'route-cache' {
  import { type Request, type Response, type NextFunction } from 'express'

  export function cacheSeconds(
    secondsTTL: number,
    cacheKey?: string,
  ): (req: Request, res: Response, next: NextFunction) => void
}
