import {Request} from "express";

export type RegisterRequest = Request & {
    body: { payload: { signature: any, request: any } }
}

export type SendBatchRequest = Request & {
    params: { index: string }
}
