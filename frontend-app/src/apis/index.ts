import axios from "axios";

export const apiRegister = async (payload: { signature: any, request: any }) => {
    const res = await axios.post(`${import.meta.env.VITE_API}register`, {
        payload
    })
    return res?.data
}
