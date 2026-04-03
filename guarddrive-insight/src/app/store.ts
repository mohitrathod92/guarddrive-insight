import { configureStore } from '@reduxjs/toolkit';
import { guarddriveApi } from '../features/api/apiSlice';
import fleetReducer from '../features/fleet/fleetSlice';

export const store = configureStore({
  reducer: {
    [guarddriveApi.reducerPath]: guarddriveApi.reducer,
    fleet: fleetReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(guarddriveApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
