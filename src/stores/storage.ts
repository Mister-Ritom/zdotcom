import Constants, { ExecutionEnvironment } from "expo-constants";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let mmkv: any = null;

if (!isExpoGo) {
  const { createMMKV } = require("react-native-mmkv");
  mmkv = createMMKV({ id: "z-settings" });
}

export const storage = {
  getString: (key: string) => mmkv?.getString(key),
  getBoolean: (key: string) => mmkv?.getBoolean(key),
  set: (key: string, value: string | boolean) => mmkv?.set(key, value),
};
