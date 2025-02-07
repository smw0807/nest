import * as Joi from 'joi';

export const validationSchema = Joi.object({
  OKKY_ID: Joi.string().required(),
  OKKY_PASSWORD: Joi.string().required(),
});
