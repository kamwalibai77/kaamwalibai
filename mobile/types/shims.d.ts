// Temporary module shims to suppress TS "Cannot find module" errors while
// dependencies are being installed. These are minimal, conservative types
// that let the editor/tsserver continue working. Remove them once proper
// packages and @types are installed.

declare module "@react-navigation/native" {
  // Minimal helpers used by the app
  export type NavigationProp = any;
  export function useNavigation<T = any>(): any;
  export function useRoute(): any;
}

declare module "@react-navigation/native-stack" {
  // Minimal NativeStackScreenProps so code like
  //   type Props = NativeStackScreenProps<RootStackParamList, 'Login'>
  // compiles in the editor. These are intentionally permissive.
  export type NativeStackScreenProps<
    ParamList extends Record<string, any> = Record<string, any>,
    RouteName extends keyof ParamList = string
  > = {
    navigation: any;
    route: { key?: string; name: RouteName; params?: ParamList[RouteName] };
  };

  export type NativeStackNavigationProp<T = any> = any;
}

declare module "@react-native-async-storage/async-storage" {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  export default AsyncStorage;
}

declare module "expo-file-system" {
  export function readAsStringAsync(
    uri: string,
    options?: any
  ): Promise<string>;
  export const EncodingType: any;
}

declare module "expo-image-picker" {
  export const ImagePickerResultType: any;
  export const MediaTypeOptions: {
    Images: any;
    Videos: any;
    All: any;
  };
  export function launchImageLibraryAsync(options?: any): Promise<any>;
}

declare module "react-native-dropdown-picker" {
  const DropDownPicker: any;
  export default DropDownPicker;
}

declare module "react-native-safe-area-context" {
  export const SafeAreaView: any;
}

declare module "react-native-linear-gradient" {
  const LinearGradient: any;
  export default LinearGradient;
}

declare module "react-native-paper" {
  export const Avatar: any;
  export const Card: any;
  export const List: any;
  export const Provider: any;
  export const MD3LightTheme: any;
}

declare module "react-native-vector-icons/*" {
  const Icon: any;
  export default Icon;
}

// Generic catch-all for other imports while deps are missing.
declare module "*";
