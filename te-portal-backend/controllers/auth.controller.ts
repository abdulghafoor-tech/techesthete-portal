// import { Request, Response, NextFunction } from 'express';
// import { AuthService } from '../';
// import { ApiResponse } from '../utils/apiResponse';
// import { ApiError } from '../utils/apiError';

// const authService = new AuthService();

// export class AuthController {
//   async register(req: Request, res: Response, next: NextFunction) {
//     try {
//       const result = await authService.register(req.body);
//       ApiResponse.success(res, result, 'User registered successfully', 201);
//     } catch (error) {
//       next(error);
//     }
//   }

//   async login(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { email, password } = req.body;
//       const result = await authService.login(email, password);
      
//       res.cookie('refreshToken', result.refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'strict',
//         maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
//       });

//       ApiResponse.success(res, { 
//         user: result.user, 
//         accessToken: result.accessToken 
//       }, 'Login successful');
//     } catch (error) {
//       next(error);
//     }
//   }

//   async logout(req: Request, res: Response, next: NextFunction) {
//     try {
//       res.clearCookie('refreshToken');
//       ApiResponse.success(res, null, 'Logout successful');
//     } catch (error) {
//       next(error);
//     }
//   }

//   async refreshToken(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { refreshToken } = req.cookies;
      
//       if (!refreshToken) {
//         throw new ApiError(401, 'Refresh token not found');
//       }

//       const result = await authService.refreshToken(refreshToken);
//       ApiResponse.success(res, result, 'Token refreshed');
//     } catch (error) {
//       next(error);
//     }
//   }

//   async getMe(req: Request, res: Response, next: NextFunction) {
//     try {
//       ApiResponse.success(res, req.user, 'User retrieved successfully');
//     } catch (error) {
//       next(error);
//     }
//   }
// }
