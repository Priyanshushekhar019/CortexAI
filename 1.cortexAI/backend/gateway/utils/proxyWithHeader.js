import proxy from "express-http-proxy"

export const proxyWithHeader = (serviceUrl) => {
    return proxy(serviceUrl, {
        timeout: 120000,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if (srcReq.user) {
                proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
            }
            return proxyReqOpts
        },
        userResHeaderDecorator: (headers, userReq) => {
            if (userReq.headers.origin) {
                headers["access-control-allow-origin"] = userReq.headers.origin;
                headers["access-control-allow-credentials"] = "true";
            }
            return headers;
        },
        proxyErrorHandler: (err, res, next) => {
            console.error(`Proxy error connecting to ${serviceUrl}:`, err);
            res.status(500).json({ message: "Service connection error", error: err?.message });
        }
    })
}