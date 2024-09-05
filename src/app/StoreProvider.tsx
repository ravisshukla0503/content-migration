// "use client";
// import { useRef } from "react";
// import { Provider } from "react-redux";
// import { makeStore, AppStore, persistor } from "../lib/store";
// import { PersistGate } from "redux-persist/integration/react";

// export default function StoreProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const storeRef = useRef<AppStore>();
//   if (!storeRef.current) {
//     // Create the store instance the first time this renders
//     storeRef.current = makeStore();
//     storeRef.current = {
     
//       persistor: persistStore(store),
//     };
//   }

//   return (
//     <Provider store={storeRef.current}>
//       <PersistGate loading={null} persistor={persistor}>
//         {children}
//       </PersistGate>
//     </Provider>
//   );
// }

"use client";
import { useRef } from "react";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "../lib/store";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<{ store: AppStore; persistor: any }>();

  if (!storeRef.current) {
    // Create the store instance and persistor the first time this renders
    const store = makeStore();
    storeRef.current = {
      store,
      persistor: persistStore(store),
    };
  }

  return (
    <Provider store={storeRef.current.store}>
      <PersistGate loading={null} persistor={storeRef.current.persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
