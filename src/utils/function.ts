import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
export const trimInput = (value: string) => {
  if (typeof value === "string") {
    return value.trim();
  }
  return value;
};

export const phoneNumberValidator = (value: string) => {
  const cleanedValue = value.replace(/[\s-]/g, "");

  if (cleanedValue.length === 10) {
    // phoneNumber with spaces or hyphens should have a length of 10
    return true;
  }
  // Return false for any other case
  return false;
};

export const asyncHandler =
  (
    fn: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<Response | void>
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

// Used to generate the token for the email verification

export const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

//Used to create a common function for sorting, searching and pagination
export const buildSearchPaginationSortingPipeline = (
  fields: string[],
  search: string,
  sortBy: string,
  sortOrder: "asc" | "desc",
  page: number,
  limit: number
) => {
  const pipeline: any[] = [];

  //search stage
  if (search) {
    const regex = new RegExp(search, "i");
    pipeline.push({
      $match: {
        $or: fields.map((field) => ({ [field]: regex })),
      },
    });
  }
  //sorting stage
  pipeline.push({
    $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
  });

  //pagination stages
  pipeline.push(
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    }
  );
  return pipeline;
};
