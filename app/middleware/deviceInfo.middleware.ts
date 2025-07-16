// src/middlewares/ipinfo.middleware.ts
import { Request, Response, NextFunction } from "express";
// import { createClient } from 'ipinfo';

// const ipinfoClient = createClient(process.env.IPINFO_TOKEN || '');

export const ipInfoMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    // if (!ip) {
    //   req.ipInfo = undefined;
    //   return next();
    // }

    // const info = await ipinfoClient.lookupIp(ip);
    // req.ipInfo = {
    //   location: info.country ? `${info.city}, ${info.region}` : undefined,
    //   country: info.country,
    //   city: info.city,
    //   timezone: info.timezone,
    //   coordinates: info.loc?.split(','), // [lat, long]
    //   isp: info.org
    // };
    next();
  } catch (error) {
    // console.error('IP Info Error:', error);
    // req.ipInfo = undefined;
    // next();
  }
};
