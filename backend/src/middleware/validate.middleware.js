import { z } from 'zod';
import { sendError } from '../utils/response.js';

/**
 * Express middleware to validate request payload against a Zod schema
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = source === 'query' ? req.query : req.body;
      const parsedData = schema.parse(dataToValidate);
      if (source === 'query') {
        req.query = parsedData;
      } else {
        req.body = parsedData;
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return sendError(res, 'Validation error: Invalid request parameters', 400, formattedErrors);
      }
      next(error);
    }
  };
};

/**
 * Zod Schemas for Authentication & Queries
 */
export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  age: z.coerce.number().int().positive('Age must be a positive integer'),
  contact: z.string().min(5, 'Contact info is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  height: z.string().min(1, 'Height is required'),
  weight: z.string().min(1, 'Weight is required'),
  medicalHistory: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const medhubLoginSchema = z.object({
  medhubId: z.string().min(1, 'Med.hub ID is required'),
});

export const fileQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  fileType: z.string().optional(),
});
