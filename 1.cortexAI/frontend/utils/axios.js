import axios from "axios";

const api=axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL || "https://d1g6ovu3kgw2fn.cloudfront.net",
    withCredentials:true
})

export default api

