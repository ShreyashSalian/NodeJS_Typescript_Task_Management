import { validationResult } from "express-validator";

import express, { Request, Response, NextFunction } from "express";

export const validateApi = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Promise<void> => {
  const errors: any = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors: { [key: string]: string } = {};

  errors
    .array({ onlyFirstError: true })
    .map((err: any) => (extractedErrors[err.path] = err.msg));

  const responsePayload = {
    status: 417,
    message: null,
    data: null,
    error: extractedErrors,
  };

  res.status(417).json(responsePayload);
  return; // Explicitly return void here
};
