import { Request, Response, NextFunction } from 'express';
import * as joi from 'joi';
import { ValidationError } from '../utils/errors';

export const validateRequest = (schema: joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
        value: detail.context?.value,
      }));

      throw new ValidationError('Validation failed', details);
    }

    // Replace the original with validated and sanitized data
    req[property] = value;
    next();
  };
};

export const validateQuery = (schema: joi.ObjectSchema) => {
  return validateRequest(schema, 'query');
};

export const validateParams = (schema: joi.ObjectSchema) => {
  return validateRequest(schema, 'params');
};

// Common validation schemas
export const commonSchemas = {
  id: joi.string().alphanum().length(20).required(),
  email: joi.string().email().required(),
  password: joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  pagination: joi.object({
    limit: joi.number().integer().min(1).max(100).default(20),
    offset: joi.number().integer().min(0).default(0),
    page: joi.number().integer().min(1),
  }),
  companyId: joi.string().required(),
  userId: joi.string().required(),
};