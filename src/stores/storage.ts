import Constants, { ExecutionEnvironment } from "expo-constants";
import { createMMKV } from "react-native-mmkv";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const mmkv = isExpoGo ? null : createMMKV({ id: "z-settings" });

export const storage = {
  getString: (key: string) => mmkv?.getString(key),
  getBoolean: (key: string) => mmkv?.getBoolean(key),
  set: (key: string, value: string | boolean) => mmkv?.set(key, value),
};
