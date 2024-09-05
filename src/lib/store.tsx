import { configureStore } from '@reduxjs/toolkit'
import { setTableSlice } from './feature/setTableSlice'
import { persistReducer, persistStore } from 'redux-persist';
import localStorage from 'redux-persist/lib/storage';

const persistConfig = {
    key: 'root',
    storage: localStorage,
  }
   
const persistedReducer = persistReducer(persistConfig, setTableSlice.reducer);

export const makeStore = () => {
  return configureStore({
    reducer: {
        wpTableState: persistedReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
  })
}

export const persistor = persistStore(makeStore());
// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']