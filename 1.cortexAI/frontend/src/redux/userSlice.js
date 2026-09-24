import { createSlice } from "@reduxjs/toolkit";

const getCachedUser = () => {
  try {
    const saved = localStorage.getItem("cortex_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: getCachedUser(),
  },
  reducers: {
    setUserdata: (state, action) => {
      state.userData = action.payload;
      try {
        if (action.payload) {
          localStorage.setItem("cortex_user", JSON.stringify(action.payload));
        } else {
          localStorage.removeItem("cortex_user");
        }
      } catch (_) {}
    }
  }
});

export const { setUserdata } = userSlice.actions;
export default userSlice.reducer;

