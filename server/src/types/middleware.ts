export type { Request } from "@/request"
export type { Response } from "@/response"

export type Middleware = (req: Request, res: Response, next: () => void) => Promise<void> | void
