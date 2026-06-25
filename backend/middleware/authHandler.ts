import express from 'express'
import AnotherError from '../utils/errors/anotherError'
import jwt, { JwtPayload, Secret } from 'jsonwebtoken'
import { variables } from '../config/envLoader'
import { userTypeList } from '../config/constants/userTypes'
import { createError } from '../utils/errors/createError'

export interface IAuthData {
  isAuth: boolean
  name: string
  userType: (typeof userTypeList)[number]
  userId: string
  email:string
}

export interface IDecodedJWT extends JwtPayload, IAuthData {}

declare global {
  namespace Express {
    interface Request {
      authData?: IAuthData
    }
  }
}

class AuthHandler {
  static async authMiddleware(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    if (!request.headers.authorization) {
      return next(createError({status:401,message:"need signin"}))
    }
    const token = request.headers.authorization.split(' ')[1]
    if (!token) {
      return next(createError({status:401,message:"need signin"}))
    }
    const jwtSecret: Secret = variables.JWT_SECRET

    try {
      const decodedToken = jwt.verify(token, jwtSecret) as IDecodedJWT
      request.authData = {
        isAuth: true,
        name: decodedToken.name,
        userType: decodedToken.userType,
        userId: decodedToken.userId,
        email: decodedToken.email
      }
      return next()
    } catch (err) {
      return next(createError({status:401,message:"need signin"}))
    }
  }
}

export default AuthHandler
