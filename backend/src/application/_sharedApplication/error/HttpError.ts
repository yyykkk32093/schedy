export class HttpError extends Error {
    readonly statusCode: number
    readonly code: string

    constructor(params: { statusCode: number; code: string; message?: string }) {
        super(params.message ?? params.code)
        this.statusCode = params.statusCode
        this.code = params.code
        this.name = 'HttpError'
    }
}
